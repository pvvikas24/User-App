import MainLayout from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MyTripsPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>My Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the My Trips page. Past and upcoming trip details will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
