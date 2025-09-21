
import MainLayout from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the profile page. User details and preferences will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
