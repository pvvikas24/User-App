import MainLayout from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FareChartPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Fare Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the fare chart page. Fare details based on distance or routes will be available here.</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
