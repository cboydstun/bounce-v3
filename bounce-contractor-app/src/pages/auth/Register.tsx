import React from "react";
import { RegistrationWizard } from "../../components/auth/RegistrationWizard";

/**
 * Register Component
 *
 * Now uses the new RegistrationWizard for a multi-step registration process
 * that includes account creation, professional profile, and optional W-9 tax form.
 */
const Register: React.FC = () => {
  return <RegistrationWizard />;
};

export default Register;
