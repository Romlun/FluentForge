import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Signed in as {user?.email}</p>
        <form action={logout}>
          <Button type="submit" variant="outline">Sign out</Button>
        </form>
      </div>
    </main>
  )
}
