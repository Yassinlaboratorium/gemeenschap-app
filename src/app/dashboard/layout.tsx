import PushOnboardingModal from '@/components/onboarding/PushOnboardingModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PushOnboardingModal />
    </>
  )
}
