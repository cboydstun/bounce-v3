import React from 'react';
import { IVisitor } from '@/types/visitor';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface FormEngagementAnalyticsProps {
  visitors: IVisitor[];
}

export default function FormEngagementAnalytics({ visitors }: FormEngagementAnalyticsProps) {
  // State for form type filter
  const [formType, setFormType] = React.useState<'all' | 'contact' | 'coupon'>('all');
  
  // Extract form interactions from visitors
  const allFormInteractions = visitors.flatMap(visitor => 
    visitor.interactions?.filter(interaction => 
      interaction.type === 'form_start' || 
      interaction.type === 'form_field_focus' || 
      interaction.type === 'form_field_complete' ||
      interaction.type === 'form_submit' ||
      interaction.type === 'contact_form' ||
      interaction.type === 'success_page_view' ||
      interaction.type === 'success_page_cta_click'
    ) || []
  );
  
  // Filter interactions by form type
  const formInteractions = allFormInteractions.filter(interaction => {
    if (formType === 'all') return true;
    
    const element = interaction.element || '';
    if (formType === 'contact') return element.includes('contact-form');
    if (formType === 'coupon') return element.includes('coupon-form');
    
    return true;
  });

  // Calculate form engagement metrics
  const formStarts = formInteractions.filter(i => i.type === 'form_start').length;
  const formSubmits = formInteractions.filter(i => i.type === 'form_submit').length;
  const formCompletions = formInteractions.filter(i => i.type === 'contact_form').length;
  const successPageViews = formInteractions.filter(i => i.type === 'success_page_view').length;
  const ctaClicks = formInteractions.filter(i => i.type === 'success_page_cta_click').length;

  // Calculate conversion rates
  const startToSubmitRate = formStarts > 0 ? (formSubmits / formStarts * 100).toFixed(1) : '0';
  const submitToCompletionRate = formSubmits > 0 ? (formCompletions / formSubmits * 100).toFixed(1) : '0';
  const completionToSuccessRate = formCompletions > 0 ? (successPageViews / formCompletions * 100).toFixed(1) : '0';
  const successToCTARate = successPageViews > 0 ? (ctaClicks / successPageViews * 100).toFixed(1) : '0';

  // Field completion analysis
  const fieldInteractions = formInteractions.filter(i => i.type === 'form_field_complete');
  const fieldCompletionCounts: Record<string, number> = {};
  
  fieldInteractions.forEach(interaction => {
    const field = interaction.data?.field;
    if (field) {
      fieldCompletionCounts[field] = (fieldCompletionCounts[field] || 0) + 1;
    }
  });

  // Prepare field completion data for chart
  const fieldLabels = Object.keys(fieldCompletionCounts);
  const fieldData = Object.values(fieldCompletionCounts);

  // Prepare funnel data
  const funnelData = {
    labels: ['Form Starts', 'Form Submits', 'Successful Submissions', 'Success Page Views', 'CTA Clicks'],
    datasets: [
      {
        label: formType === 'all' 
          ? 'All Forms Funnel' 
          : formType === 'contact' 
            ? 'Contact Form Funnel' 
            : 'Coupon Form Funnel',
        data: [formStarts, formSubmits, formCompletions, successPageViews, ctaClicks],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare field completion chart data
  const fieldCompletionData = {
    labels: fieldLabels,
    datasets: [
      {
        label: 'Field Completion Count',
        data: fieldData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Extract extras selection data
  const extrasSelections = formInteractions
    .filter(i => i.type === 'form_extras_selection')
    .map(i => i.data?.extrasSelected || 0);
  
  const extrasDistribution: Record<number, number> = {};
  extrasSelections.forEach(count => {
    extrasDistribution[count] = (extrasDistribution[count] || 0) + 1;
  });

  // Prepare extras selection chart data
  const extrasLabels = Object.keys(extrasDistribution).map(k => `${k} extras`);
  const extrasData = Object.values(extrasDistribution);
  
  const extrasChartData = {
    labels: extrasLabels,
    datasets: [
      {
        label: 'Extras Selection Distribution',
        data: extrasData,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Get high intent visitors based on form engagement
  const highIntentFormVisitors = visitors
    .filter(visitor => 
      visitor.intentScore && visitor.intentScore > 50 &&
      visitor.interactions?.some(i => 
        i.type === 'form_start' || 
        i.type === 'form_submit' || 
        i.type === 'contact_form'
      )
    )
    .sort((a, b) => (b.intentScore || 0) - (a.intentScore || 0))
    .slice(0, 5);

  // Count interactions by form type
  const contactFormCount = allFormInteractions.filter(i => 
    (i.element || '').includes('contact-form') && i.type === 'form_start'
  ).length;
  
  const couponFormCount = allFormInteractions.filter(i => 
    (i.element || '').includes('coupon-form') && i.type === 'form_start'
  ).length;
  
  return (
    <div className="space-y-6">
      {/* Form Type Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Form Type Filter</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setFormType('all')}
            className={`px-4 py-2 rounded-lg ${
              formType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All Forms ({contactFormCount + couponFormCount})
          </button>
          <button
            onClick={() => setFormType('contact')}
            className={`px-4 py-2 rounded-lg ${
              formType === 'contact'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Contact Form ({contactFormCount})
          </button>
          <button
            onClick={() => setFormType('coupon')}
            className={`px-4 py-2 rounded-lg ${
              formType === 'coupon'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Coupon Form ({couponFormCount})
          </button>
        </div>
      </div>
      {/* Form Engagement Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          {formType === 'all' 
            ? 'All Forms Engagement Summary' 
            : formType === 'contact' 
              ? 'Contact Form Engagement Summary' 
              : 'Coupon Form Engagement Summary'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Form Start Rate</p>
            <p className="text-2xl font-bold">{startToSubmitRate}%</p>
            <p className="text-xs text-gray-500">Forms started to submitted</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Form Completion Rate</p>
            <p className="text-2xl font-bold">{submitToCompletionRate}%</p>
            <p className="text-xs text-gray-500">Forms submitted to completed</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Success Page View Rate</p>
            <p className="text-2xl font-bold">{completionToSuccessRate}%</p>
            <p className="text-xs text-gray-500">Completions to success page</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">CTA Click Rate</p>
            <p className="text-2xl font-bold">{successToCTARate}%</p>
            <p className="text-xs text-gray-500">Success page to CTA clicks</p>
          </div>
        </div>
        
        <div className="h-80">
          <Bar 
            data={funnelData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: formType === 'all' 
                    ? 'All Forms Conversion Funnel' 
                    : formType === 'contact' 
                      ? 'Contact Form Conversion Funnel' 
                      : 'Coupon Form Conversion Funnel'
                },
              },
            }} 
          />
        </div>
      </div>
      
      {/* Field Completion Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Field Completion Analysis</h3>
          <div className="h-64">
            <Bar 
              data={fieldCompletionData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: true,
                    text: 'Field Completion Counts'
                  },
                },
              }} 
            />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>This chart shows which form fields users are most likely to complete, helping identify potential friction points in your form.</p>
          </div>
        </div>
        
        {/* Extras Selection Distribution - Only show for contact form */}
        {(formType === 'all' || formType === 'contact') && extrasSelections.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Extras Selection Distribution</h3>
            <div className="h-64">
              <Pie 
                data={extrasChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    title: {
                      display: true,
                      text: 'Extras Selection Distribution'
                    },
                  },
                }} 
              />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>This chart shows how many extras users typically select, helping you understand which add-ons are most popular.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* High Intent Form Visitors */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">High Intent Form Visitors</h3>
        
        {highIntentFormVisitors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intent Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {highIntentFormVisitors.map(visitor => (
                  <tr key={String(visitor._id)} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {String(visitor.visitorId).substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {visitor.intentScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(visitor.lastVisit).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {visitor.interactions?.some(i => i.type === 'contact_form') ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      ) : visitor.interactions?.some(i => i.type === 'form_submit') ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Submitted
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Started
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No high intent visitors found</p>
        )}
      </div>
      
      {/* Form Engagement Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Form Engagement Insights</h3>
        
        <div className="space-y-4">
          {formStarts > 0 && (
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="font-medium">Form Abandonment</p>
              <p className="text-sm text-gray-600 mt-1">
                {formStarts > formSubmits 
                  ? `${((formStarts - formSubmits) / formStarts * 100).toFixed(1)}% of users abandon the form before submitting. Consider simplifying the form or adding progress indicators.`
                  : "Your form has an excellent completion rate. Keep monitoring to maintain this performance."}
              </p>
            </div>
          )}
          
          {Object.keys(fieldCompletionCounts).length > 0 && (
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <p className="font-medium">Field Completion Analysis</p>
              <p className="text-sm text-gray-600 mt-1">
                {Object.entries(fieldCompletionCounts)
                  .sort((a, b) => a[1] - b[1])
                  .slice(0, 1)
                  .map(([field, count]) => 
                    `The "${field}" field has the lowest completion rate. Consider making this field optional or providing more guidance.`
                  )}
              </p>
            </div>
          )}
          
          {successPageViews > 0 && ctaClicks > 0 && (
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-medium">Success Page Engagement</p>
              <p className="text-sm text-gray-600 mt-1">
                {`${successToCTARate}% of users who view the success page click on a CTA. ${
                  parseFloat(successToCTARate) < 30 
                    ? "Consider making your CTAs more prominent or compelling." 
                    : "Your success page is effectively guiding users to the next steps."
                }`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
