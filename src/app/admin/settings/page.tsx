"use client";

import { useState } from "react";
import { Settings, Save, RefreshCw, Bell, Mail, Database, Key, Shield } from "lucide-react";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    siteName: "Crown Coastal Realty",
    siteDescription: "Premium Real Estate in Orange County",
    contactEmail: "info@crowncoastal.com",
    contactPhone: "+1 (949) 555-0100",
    
    // API Settings
    trestleApiKey: "sk_live_*********************",
    trestleApiUrl: "https://api-prod.corelogic.com/trestle/odata/",
    openaiApiKey: "sk-*********************",
    googleMapsApiKey: "AIza*********************",
    
    // SEO Settings
    defaultMetaTitle: "Crown Coastal Realty - Orange County Real Estate",
    defaultMetaDescription: "Find your dream home in Orange County with Crown Coastal Realty",
    googleAnalyticsId: "G-XXXXXXXXXX",
    googleSearchConsole: "enabled",
    
    // Email Settings
    emailProvider: "sendgrid",
    emailFrom: "noreply@crowncoastal.com",
    emailNotifications: true,
    
    // Automation Settings
    autoSyncProperties: true,
    syncInterval: "daily",
    autoBlogGeneration: true,
    blogPostsPerWeek: 7,
    
    // Security Settings
    twoFactorAuth: false,
    passwordExpiry: "90",
    sessionTimeout: "60",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Settings className="text-primary-600" size={32} />
            Settings
          </h1>
          <p className="text-slate-600 mt-1">Configure your application settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* General Settings */}
      <SettingsSection title="General Settings" icon={<Settings size={20} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Site Name"
            value={settings.siteName}
            onChange={(value) => setSettings({ ...settings, siteName: value })}
          />
          <InputField
            label="Contact Email"
            type="email"
            value={settings.contactEmail}
            onChange={(value) => setSettings({ ...settings, contactEmail: value })}
          />
          <InputField
            label="Contact Phone"
            value={settings.contactPhone}
            onChange={(value) => setSettings({ ...settings, contactPhone: value })}
          />
        </div>
        <TextAreaField
          label="Site Description"
          value={settings.siteDescription}
          onChange={(value) => setSettings({ ...settings, siteDescription: value })}
        />
      </SettingsSection>

      {/* API Settings */}
      <SettingsSection title="API Integrations" icon={<Key size={20} />}>
        <div className="space-y-4">
          <InputField
            label="Trestle API Key"
            type="password"
            value={settings.trestleApiKey}
            onChange={(value) => setSettings({ ...settings, trestleApiKey: value })}
          />
          <InputField
            label="Trestle API URL"
            value={settings.trestleApiUrl}
            onChange={(value) => setSettings({ ...settings, trestleApiUrl: value })}
          />
          <InputField
            label="OpenAI API Key"
            type="password"
            value={settings.openaiApiKey}
            onChange={(value) => setSettings({ ...settings, openaiApiKey: value })}
          />
          <InputField
            label="Google Maps API Key"
            type="password"
            value={settings.googleMapsApiKey}
            onChange={(value) => setSettings({ ...settings, googleMapsApiKey: value })}
          />
        </div>
      </SettingsSection>

      {/* SEO Settings */}
      <SettingsSection title="SEO Settings" icon={<Database size={20} />}>
        <div className="space-y-4">
          <InputField
            label="Default Meta Title"
            value={settings.defaultMetaTitle}
            onChange={(value) => setSettings({ ...settings, defaultMetaTitle: value })}
          />
          <TextAreaField
            label="Default Meta Description"
            value={settings.defaultMetaDescription}
            onChange={(value) => setSettings({ ...settings, defaultMetaDescription: value })}
          />
          <InputField
            label="Google Analytics ID"
            value={settings.googleAnalyticsId}
            onChange={(value) => setSettings({ ...settings, googleAnalyticsId: value })}
          />
        </div>
      </SettingsSection>

      {/* Email Settings */}
      <SettingsSection title="Email Settings" icon={<Mail size={20} />}>
        <div className="space-y-4">
          <SelectField
            label="Email Provider"
            value={settings.emailProvider}
            onChange={(value) => setSettings({ ...settings, emailProvider: value })}
            options={[
              { value: "sendgrid", label: "SendGrid" },
              { value: "mailgun", label: "Mailgun" },
              { value: "smtp", label: "Custom SMTP" },
            ]}
          />
          <InputField
            label="Email From Address"
            type="email"
            value={settings.emailFrom}
            onChange={(value) => setSettings({ ...settings, emailFrom: value })}
          />
          <CheckboxField
            label="Enable Email Notifications"
            checked={settings.emailNotifications}
            onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
          />
        </div>
      </SettingsSection>

      {/* Automation Settings */}
      <SettingsSection title="Automation Settings" icon={<Bell size={20} />}>
        <div className="space-y-4">
          <CheckboxField
            label="Auto-sync Properties from Trestle"
            checked={settings.autoSyncProperties}
            onChange={(checked) => setSettings({ ...settings, autoSyncProperties: checked })}
          />
          <SelectField
            label="Sync Interval"
            value={settings.syncInterval}
            onChange={(value) => setSettings({ ...settings, syncInterval: value })}
            options={[
              { value: "hourly", label: "Every Hour" },
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
            ]}
          />
          <CheckboxField
            label="Enable Auto Blog Generation"
            checked={settings.autoBlogGeneration}
            onChange={(checked) => setSettings({ ...settings, autoBlogGeneration: checked })}
          />
          <InputField
            label="Blog Posts Per Week"
            type="number"
            value={settings.blogPostsPerWeek.toString()}
            onChange={(value) => setSettings({ ...settings, blogPostsPerWeek: parseInt(value) || 0 })}
          />
        </div>
      </SettingsSection>

      {/* Security Settings */}
      <SettingsSection title="Security Settings" icon={<Shield size={20} />}>
        <div className="space-y-4">
          <CheckboxField
            label="Enable Two-Factor Authentication"
            checked={settings.twoFactorAuth}
            onChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
          />
          <InputField
            label="Password Expiry (days)"
            type="number"
            value={settings.passwordExpiry}
            onChange={(value) => setSettings({ ...settings, passwordExpiry: value })}
          />
          <InputField
            label="Session Timeout (minutes)"
            type="number"
            value={settings.sessionTimeout}
            onChange={(value) => setSettings({ ...settings, sessionTimeout: value })}
          />
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b">
        <span className="text-primary-600">{icon}</span>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
      />
      <label className="text-sm font-medium text-slate-700">{label}</label>
    </div>
  );
}
