#!/bin/bash

# Bounce Mobile API Deployment Script
# This script handles deployment to different environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_BUILD=false
RESTART_SERVICES=true

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Target environment (production, staging, development)"
    echo "  -s, --skip-tests        Skip running tests"
    echo "  -b, --skip-build        Skip building the application"
    echo "  -n, --no-restart        Don't restart services after deployment"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e production"
    echo "  $0 --environment staging --skip-tests"
    echo "  $0 -e development -s -b"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -n|--no-restart)
            RESTART_SERVICES=false
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Valid environments: production, staging, development"
    exit 1
fi

print_status "Starting deployment to $ENVIRONMENT environment..."

# Check if we're in the correct directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the api-server directory."
    exit 1
fi

# Check if required environment file exists
ENV_FILE=".env"
if [[ "$ENVIRONMENT" != "development" ]]; then
    ENV_FILE=".env.$ENVIRONMENT"
fi

if [[ ! -f "$ENV_FILE" ]]; then
    print_warning "Environment file $ENV_FILE not found. Using .env.example as template."
    if [[ -f ".env.example" ]]; then
        cp .env.example "$ENV_FILE"
        print_warning "Please update $ENV_FILE with your environment-specific values."
    else
        print_error ".env.example not found. Cannot create environment file."
        exit 1
    fi
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check if PM2 is installed (for production)
if [[ "$ENVIRONMENT" == "production" ]] && ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2 globally..."
    npm install -g pm2
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --only=production

# Install dev dependencies if we need to build or test
if [[ "$SKIP_BUILD" == false ]] || [[ "$SKIP_TESTS" == false ]]; then
    print_status "Installing dev dependencies for build/test..."
    npm ci
fi

# Run tests (unless skipped)
if [[ "$SKIP_TESTS" == false ]]; then
    print_status "Running tests..."
    
    # Set test environment
    export NODE_ENV=test
    
    # Run tests
    if npm test; then
        print_success "All tests passed!"
    else
        print_error "Tests failed. Deployment aborted."
        exit 1
    fi
fi

# Build application (unless skipped)
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Building application..."
    
    if npm run build; then
        print_success "Build completed successfully!"
    else
        print_error "Build failed. Deployment aborted."
        exit 1
    fi
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p temp

# Set proper permissions
chmod 755 logs
chmod 755 uploads
chmod 755 temp

# Database migration/setup (if needed)
print_status "Checking database connection..."
# Add database migration commands here if needed

# Deploy based on environment
case $ENVIRONMENT in
    "production")
        print_status "Deploying to production..."
        
        # Backup current deployment (if exists)
        if [[ -d "dist.backup" ]]; then
            rm -rf dist.backup
        fi
        if [[ -d "dist" ]]; then
            mv dist dist.backup
            print_status "Created backup of previous deployment"
        fi
        
        # Start/restart with PM2
        if [[ "$RESTART_SERVICES" == true ]]; then
            if pm2 list | grep -q "bounce-mobile-api"; then
                print_status "Restarting application with PM2..."
                pm2 restart ecosystem.config.js --env production
            else
                print_status "Starting application with PM2..."
                pm2 start ecosystem.config.js --env production
            fi
            
            # Save PM2 configuration
            pm2 save
            
            # Show PM2 status
            pm2 status
        fi
        ;;
        
    "staging")
        print_status "Deploying to staging..."
        
        if [[ "$RESTART_SERVICES" == true ]]; then
            if pm2 list | grep -q "bounce-mobile-api"; then
                pm2 restart ecosystem.config.js --env staging
            else
                pm2 start ecosystem.config.js --env staging
            fi
        fi
        ;;
        
    "development")
        print_status "Deploying to development..."
        print_status "Development deployment complete. Use 'npm run dev' to start the server."
        ;;
esac

# Health check
if [[ "$RESTART_SERVICES" == true ]] && [[ "$ENVIRONMENT" != "development" ]]; then
    print_status "Performing health check..."
    
    # Wait a moment for the service to start
    sleep 5
    
    # Get port from environment or default
    PORT=${PORT:-4000}
    
    # Check health endpoint
    if curl -f -s "http://localhost:$PORT/health" > /dev/null; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed. Please check the application logs."
        if command -v pm2 &> /dev/null; then
            print_status "Recent PM2 logs:"
            pm2 logs bounce-mobile-api --lines 10
        fi
    fi
fi

# Post-deployment tasks
print_status "Running post-deployment tasks..."

# Clear any temporary files
rm -rf temp/*

# Update file permissions if needed
find logs -type f -exec chmod 644 {} \;

# Display deployment summary
print_success "Deployment to $ENVIRONMENT completed successfully!"
print_status "Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Tests: $([ "$SKIP_TESTS" == true ] && echo "Skipped" || echo "Passed")"
echo "  Build: $([ "$SKIP_BUILD" == true ] && echo "Skipped" || echo "Completed")"
echo "  Services: $([ "$RESTART_SERVICES" == true ] && echo "Restarted" || echo "Not restarted")"

if [[ "$ENVIRONMENT" != "development" ]]; then
    echo ""
    print_status "Useful commands:"
    echo "  View logs: pm2 logs bounce-mobile-api"
    echo "  Monitor: pm2 monit"
    echo "  Restart: pm2 restart bounce-mobile-api"
    echo "  Stop: pm2 stop bounce-mobile-api"
    echo "  Health check: curl http://localhost:$PORT/health"
    echo "  Metrics: curl http://localhost:$PORT/metrics"
fi

print_success "Deployment script completed!"
