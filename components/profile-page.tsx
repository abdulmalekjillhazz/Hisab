'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useUIStore } from '@/store/use-ui-store';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
import { BusinessCategoryIcon } from '@/components/business-category-icon';
import { getCachedJson, invalidateApiCache } from '@/lib/client-api-cache';

const schema = z.object({
  name: z.string().min(2),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  address: z.string().optional(),
  category: z.enum(['electrical', 'grocery', 'clothing', 'pharmacy', 'electronics', 'restaurant', 'general']),
  currency: z.enum(['BDT', 'USD']),
  invoiceFooter: z.string().optional(),
  locale: z.enum(['en', 'bn']),
});
type Form = z.infer<typeof schema>;

export function ProfilePage() {
  const [busy, setBusy] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const setLocale = useUIStore((s) => s.setLocale);

  // Password & Security PIN state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [secBusy, setSecBusy] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    getCachedJson('/api/profile')
      .then((x) => {
        if (x.data) {
          reset({
            name: x.data.name,
            ownerName: x.data.ownerName || '',
            phone: x.data.phone || '',
            email: x.data.email || '',
            address: x.data.address || '',
            category: x.data.category || 'general',
            currency: x.data.currency || 'BDT',
            invoiceFooter: x.data.invoiceFooter || '',
            locale: x.data.locale || 'en',
          });
          if (x.data.avatar) {
            setAvatar(x.data.avatar);
          }
        }
      })
      .catch(() => toast.error('Could not load shop profile. Please refresh and try again.'));
  }, [reset]);

  // Handle avatar upload with a 350 KB file-size limit.
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeInBytes = 350 * 1024; // 200 KB
    if (file.size > maxSizeInBytes) {
      toast.error('প্রোফাইল ছবি সর্বোচ্চ 350 KB (350 KB) এর মধ্যে হতে হবে!');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      setAvatarUploading(false);
      toast.success('ছবি নির্বাচিত হয়েছে। সেভ করতে নিচের বাটনে চাপ দিন।');
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      toast.error('ছবি লোড করতে সমস্যা হয়েছে!');
    };
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    setAvatar('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function save(d: Form) {
    setBusy(true);
    try {
      const r = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...d, avatar }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(j.error || `Could not save profile (${r.status})`);
        return;
      }
      if (j.data) {
        reset({
          name: j.data.name || d.name,
          ownerName: j.data.ownerName || '',
          phone: j.data.phone || '',
          email: j.data.email || '',
          address: j.data.address || '',
          category: j.data.category || d.category,
          currency: j.data.currency || d.currency,
          invoiceFooter: j.data.invoiceFooter || '',
          locale: j.data.locale || d.locale,
        });
        setAvatar(j.data.avatar || '');
      }
      setLocale(d.locale);
      invalidateApiCache('/api/profile');
      window.dispatchEvent(new Event('profile-updated'));
      toast.success('Shop profile saved successfully.');
    } catch {
      toast.error('Could not reach the server. Your changes were not confirmed.');
    } finally {
      setBusy(false);
    }
  }

  async function updateSecurity(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword && !securityPin) {
      return toast.error('নতুন পাসওয়ার্ড অথবা সিকিউরিটি পিন দিন');
    }
    setSecBusy(true);
    const r = await fetch('/api/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword, securityPin }),
    });
    const j = await r.json();
    setSecBusy(false);
    if (!r.ok) return toast.error(j.error);
    toast.success('নিরাপত্তা সেটিংস (পাসওয়ার্ড/পিন) সফলভাবে আপডেট হয়েছে!');
    setCurrentPassword('');
    setNewPassword('');
    setSecurityPin('');
  }

  return (
    <div className="max-w-4xl space-y-5 pb-10">
      <div className="mb-2">
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink">Shop & Account Settings</h2>
        <p className="mt-1 text-sm text-muted">Manage your shop identity, profile picture, password and security PIN.</p>
      </div>

      {/* Main Profile & Shop Form */}
      <form onSubmit={handleSubmit(save)} className="panel space-y-4 p-4 sm:p-6">
        <h3 className="font-heading text-sm font-bold text-ink border-b border-line pb-2">
          🏪 শপ তথ্য ও প্রোফাইল ছবি
        </h3>

        {/* Profile Picture Upload Section (Max 200 KB) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-line bg-slate-50/70 p-3.5">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="grid h-18 w-18 sm:h-20 sm:w-20 place-items-center rounded-2xl bg-gradient-to-br from-blue to-teal text-2xl font-black text-white shadow-md">
                ⚡
              </div>
            )}
            {avatar && (
              <button
                type="button"
                onClick={removeAvatar}
                className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-red text-white text-[10px] shadow"
                title="Remove photo"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-center sm:text-left flex-1">
            <h4 className="font-bold text-sm text-ink">প্রোফাইল ছবি / শপ লোগো</h4>
            <p className="text-[11px] text-muted mt-0.5">
              JPG, PNG বা WebP • <span className="font-semibold text-red">সর্বোচ্চ 350 KB (Max 350 KB)</span>
            </p>

            <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                id="avatar-upload"
                onChange={handleAvatarChange}
              />
              <label
                htmlFor="avatar-upload"
                className="btn-soft py-1 px-3 text-xs cursor-pointer active:scale-95 transition"
              >
                {avatarUploading ? 'লোড হচ্ছে…' : avatar ? 'ছবি পরিবর্তন' : '＋ ছবি আপলোড'}
              </label>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ['name', 'দোকানের নাম (Shop name) *'],
            ['ownerName', 'মালিকের নাম (Owner name)'],
            ['phone', 'মোবাইল নম্বর (Phone)'],
            ['email', 'ইমেইল (Email)'],
            ['address', 'ঠিকানা (Address)'],
            ['invoiceFooter', 'মেমোর নিচের বার্তা (Invoice footer)'],
          ].map(([k, l]) => (
            <label key={k} className="block text-xs font-semibold text-muted sm:text-sm">
              {l}
              <input className="field mt-1.5 text-ink text-sm" {...register(k as keyof Form)} />
            </label>
          ))}

          <label className="block text-xs font-semibold text-muted sm:text-sm">
            Business category
            <select className="field mt-1.5 text-sm" {...register('category')}>
              {BUSINESS_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal to-blue text-white shadow-md">
              <BusinessCategoryIcon category={watch('category')} className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-ink">Category icon preview</span>
          </div>

          <label className="block text-xs font-semibold text-muted sm:text-sm">
            কারেন্সি (Currency)
            <select className="field mt-1.5 text-sm" {...register('currency')}>
              <option value="BDT">BDT — ৳ (টাকা)</option>
              <option value="USD">USD — $ (ডলার)</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-muted sm:text-sm">
            ভাষা (Language)
            <select className="field mt-1.5 text-sm" {...register('locale')}>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="en">English (ইংরেজি)</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end pt-2 border-t border-line">
          <button disabled={busy} className="btn-primary py-2 px-5 text-xs sm:text-sm font-bold">
            {busy ? 'সংরক্ষণ হচ্ছে…' : '✓ তথ্য সেভ করুন'}
          </button>
        </div>
      </form>

      {/* Password & Security PIN Update Form */}
      <form onSubmit={updateSecurity} className="panel space-y-4 p-4 sm:p-6">
        <div className="border-b border-line pb-2">
          <h3 className="font-heading text-sm font-bold text-ink">
            🔐 পাসওয়ার্ড ও সিকিউরিটি পিন পরিবর্তন
          </h3>
          <p className="text-[11px] text-muted">
            পাসওয়ার্ড ভুলে গেলে পুনরুদ্ধারের জন্য আপনার একটি সিকিউরিটি পিন (Default: 1234) সেট করে রাখুন।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-muted">
            বর্তমান পাসওয়ার্ড (Current Password)
            <input
              type="password"
              className="field mt-1 text-xs sm:text-sm"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>

          <label className="block text-xs font-semibold text-muted">
            নতুন পাসওয়ার্ড (New Password)
            <input
              type="password"
              minLength={6}
              className="field mt-1 text-xs sm:text-sm"
              placeholder="কমপক্ষে ৬ অক্ষর"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>

          <label className="block text-xs font-semibold text-muted sm:col-span-2">
            মাস্টার সিকিউরিটি পিন (Master Security PIN - ৪ থেকে ৮ সংখ্যা)
            <input
              type="text"
              maxLength={8}
              className="field mt-1 text-xs sm:text-sm font-mono tracking-widest"
              placeholder="যেমন: 5678 (পাসওয়ার্ড রিকভারির জন্য গোপন পিন)"
              value={securityPin}
              onChange={(e) => setSecurityPin(e.target.value)}
            />
          </label>
        </div>

        <div className="flex justify-end pt-2 border-t border-line">
          <button disabled={secBusy} className="btn-primary py-2 px-5 text-xs sm:text-sm font-bold">
            {secBusy ? 'আপডেট হচ্ছে…' : '✓ সিকিউরিটি সেভ করুন'}
          </button>
        </div>
      </form>
    </div>
  );
}
