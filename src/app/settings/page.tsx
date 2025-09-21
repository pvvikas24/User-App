
import MainLayout from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the settings page. Application settings and configurations will be available here.</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
