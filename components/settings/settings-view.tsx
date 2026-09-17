'use client';

import React, { useState } from 'react';
import { Settings, Save, Building, Receipt, Percent } from 'lucide-react';
import { updateSettingsAction } from '@/app/actions/settings';

interface SettingsViewProps {
  initialSettings: Record<string, string>;
}

export function SettingsView({ initialSettings }: SettingsViewProps) {
  const [settings, setSettings] = useState({
    company_name: initialSettings.company_name || 'Mudassar Publishers',
    company_phone: initialSettings.company_phone || '+92 300 1234567',
    company_email: initialSettings.company_email || 'info@mudassarpublishers.com',
    company_address: initialSettings.company_address || 'Main Commercial Market, Gulberg III, Lahore',
    currency: initialSettings.currency || 'Rs.',
    tax_rate: initialSettings.tax_rate || '0',
    invoice_prefix: initialSettings.invoice_prefix || 'INV-',
    pos_receipt_footer: initialSettings.pos_receipt_footer || 'Thank you for shopping at Mudassar Publishers!',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateSettingsAction(settings);
      if (!res.success) throw new Error(res.error);
      alert('System settings updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">System & Company Settings</h2>
          <p className="text-xs text-stone-500">
            Configure company credentials, invoice prefixes, receipts, tax defaults, and regional currency settings.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Company Info Section */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-orange-500" /> Company Profile & Contact Info
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contact Phone</label>
              <input
                type="text"
                required
                value={settings.company_phone}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Support Email</label>
              <input
                type="email"
                required
                value={settings.company_email}
                onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Showroom / Store Address</label>
              <input
                type="text"
                required
                value={settings.company_address}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>
        </div>

        {/* POS Receipt & Financial Configurations */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-500" /> POS & Receipt Configurations
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                required
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="e.g. Rs."
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                required
                value={settings.invoice_prefix}
                onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                placeholder="e.g. INV-"
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Default Sales Tax (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.tax_rate}
                onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Receipt Footer Message</label>
            <input
              type="text"
              value={settings.pos_receipt_footer}
              onChange={(e) => setSettings({ ...settings, pos_receipt_footer: e.target.value })}
              placeholder="Footer text printed on thermal POS receipts..."
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-md hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
