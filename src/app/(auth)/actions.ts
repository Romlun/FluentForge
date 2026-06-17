'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function authErrorDetails(error: { message: string; status?: number; code?: string }) {
  return {
    message: error.message,
    status: error.status,
    code: error.code,
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: formData.get('password') as string,
  })
  if (error) {
    console.error('[auth] login failed', { email, error: authErrorDetails(error) })
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const { error } = await supabase.auth.signUp({
    email,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (error) {
    console.error('[auth] signup failed', { email, error: authErrorDetails(error) })
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/confirm')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
