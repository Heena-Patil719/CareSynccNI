import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Language = "en" | "es" | "fr" | "hi";

export const translations = {
  en: {
    // Common
    dashboard: "Dashboard",
    codeMapping: "Code Mapping",
    patients: "Patients",
    admin: "Admin",
    profile: "Profile",
    logout: "Logout",
    login: "Login",
    signup: "Sign Up",
    signIn: "Sign In",
    email: "Email",
    password: "Password",
    firstName: "First Name",
    lastName: "Last Name",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    logout: "Log Out",
    
    // Landing Page
    bridgeTraditionalModern: "Bridge Traditional & Modern Medicine",
    mapNAMASTEtoICD11: "Map NAMASTE (Ayurveda, Siddha, Unani) diagnosis codes to ICD-11 with our secure, FHIR-compliant platform.",
    getStarted: "Get Started",
    learnMore: "Learn More",
    codesMap: "Codes Mapped",
    users: "Users",
    accuracy: "Accuracy",
    keyFeatures: "Key Features",
    codeMapping: "Code Mapping",
    codesMappingDesc: "Map NAMASTE codes to ICD-11 with confidence scores",
    patientManagement: "Patient Management",
    patientManagementDesc: "Store and manage patient records with diagnoses",
    security: "Security",
    securityDesc: "Role-based access control and secure authentication",
    fhirCompliance: "FHIR Compliance",
    fhirComplianceDesc: "Export patient data in FHIR JSON format",
    analytics: "Analytics",
    analyticsDesc: "Track mapping coverage and patient health trends",
    adminDashboard: "Admin Dashboard",
    adminDashboardDesc: "Manage codes, mappings, and user access",
    howItWorks: "How It Works",
    signup: "Sign Up",
    search: "Search",
    map: "Map",
    export: "Export",
    createAccount: "Create your account",
    findCodesDesc: "Find NAMASTE codes",
    matchToICD11: "Match to ICD-11 codes",
    downloadFHIR: "Download FHIR JSON",
    readyToGetStarted: "Ready to Get Started?",
    joinHealthcareProviders: "Join hundreds of healthcare providers using Care Sync",
    signUpNow: "Sign Up Now",

    // Auth
    createAccount: "Create Account",
    welcomeBack: "Welcome Back",
    joinCareSyncManage: "Join Care Sync to manage patient records",
    signInAccount: "Sign in to your Care Sync account",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    demoCredentials: "Demo credentials: demo@example.com / password123",

    // Patients
    patientRecords: "Patient Records",
    createPatient: "Create Patient",
    patientList: "Patient List",
    birthDate: "Birth Date",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    diagnoses: "Diagnoses",
    healthUpdates: "Health Updates",
    exportFHIR: "Export FHIR",

    // Admin
    adminPanel: "Admin Panel",
    codesList: "Codes List",
    mappingsList: "Mappings List",
    coverage: "Coverage",
    usersList: "Users List",
    manageUsers: "Manage Users",
    addNewCode: "Add New Code",
    uploadCodes: "Upload Codes",

    // UI
    createNewPatient: "Create New Patient",
    viewDetails: "View Details",
    addDiagnosis: "Add Diagnosis",
    removeDiagnosis: "Remove Diagnosis",
    updateProfile: "Update Profile",
    changePassword: "Change Password",
    accountSettings: "Account Settings",
  },
  es: {
    dashboard: "Panel de Control",
    codeMapping: "Mapeo de Códigos",
    patients: "Pacientes",
    admin: "Administrador",
    profile: "Perfil",
    logout: "Cerrar Sesión",
    email: "Correo Electrónico",
    password: "Contraseña",
    firstName: "Nombre",
    lastName: "Apellido",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    search: "Búsqueda",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    settings: "Configuración",
    language: "Idioma",
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
    bridgeTraditionalModern: "Conectar Medicina Tradicional y Moderna",
    mapNAMASTEtoICD11: "Asigne códigos de diagnóstico NAMASTE (Ayurveda, Siddha, Unani) a ICD-11 con nuestra plataforma segura y compatible con FHIR.",
  },
  fr: {
    dashboard: "Tableau de Bord",
    codeMapping: "Mappage des Codes",
    patients: "Patients",
    admin: "Administrateur",
    profile: "Profil",
    logout: "Déconnexion",
    email: "E-mail",
    password: "Mot de passe",
    firstName: "Prénom",
    lastName: "Nom",
    save: "Enregistrer",
    cancel: "Annuler",
    edit: "Modifier",
    delete: "Supprimer",
    search: "Recherche",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    settings: "Paramètres",
    language: "Langue",
    theme: "Thème",
    light: "Clair",
    dark: "Sombre",
    system: "Système",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    codeMapping: "कोड मैपिंग",
    patients: "रोगी",
    admin: "व्यवस्थापक",
    profile: "प्रोफ़ाइल",
    logout: "लॉग आउट",
    email: "ईमेल",
    password: "पासवर्ड",
    firstName: "पहला नाम",
    lastName: "अंतिम नाम",
    save: "सहेजें",
    cancel: "रद्द करें",
    edit: "संपादित करें",
    delete: "हटाएं",
    search: "खोज",
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफलता",
    settings: "सेटिंग",
    language: "भाषा",
    theme: "विषय",
    light: "हल्का",
    dark: "गहरा",
    system: "सिस्टम",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedLang = (localStorage.getItem("careSync_language") as Language) || "en";
    setLanguageState(savedLang);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("careSync_language", lang);
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
