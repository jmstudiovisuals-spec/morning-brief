export const metadata = {
  title: 'Morning Brief — JMStudio',
  description: 'Ton brief matinal personnalisé',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
