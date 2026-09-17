'use client';

import React, { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { BookMarked, Lock, User, KeyRound, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4 antialiased font-sans text-stone-900">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-500/20">
            <BookMarked className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Mudassar Publishers POS
          </h1>
          <p className="text-xs text-stone-500">
            Sign in to access your point of sale, inventory, and sales ledger.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-md">
          <form action={formAction} className="space-y-4 text-xs">
            {state?.error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-700 mb-1.5">
                Email or Employee ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  name="loginInput"
                  required
                  placeholder="e.g. admin@bookpos.com or EMP-0001"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
            >
              {isPending ? 'Signing in...' : 'Sign In to POS System'}
            </button>
          </form>

          {/* Seed Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-[11px] text-stone-500 space-y-1.5">
            <p className="font-bold text-stone-700 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-orange-500" /> Demo Credentials (After Seed):
            </p>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 font-mono text-[10px] space-y-1">
              <p><strong className="text-orange-600">Admin:</strong> admin@bookpos.com / admin123</p>
              <p><strong className="text-blue-600">Manager:</strong> manager@bookpos.com / emp123</p>
              <p><strong className="text-stone-700">Employee:</strong> emp1@bookpos.com / emp123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
