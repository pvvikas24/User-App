'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { optimizeRoute, OptimizeRouteOutput } from '@/ai/flows/route-optimization';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Route, Clock, Info } from 'lucide-react';
import { initialBuses, routes as busRoutesData, busStops } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const formSchema = z.object({
  currentLocation: z.string().min(1, 'Current location is required'),
  destination: z.string().min(1, 'Destination is required'),
});

type RouteOptimizerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userLocationString: string | null;
};

const RouteOptimizer = ({ open, onOpenChange, userLocationString }: RouteOptimizerProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeRouteOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentLocation: userLocationString || '',
      destination: '',
    },
  });

  React.useEffect(() => {
    if (userLocationString) {
      form.setValue('currentLocation', userLocationString);
    }
  }, [userLocationString, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const busSchedules = JSON.stringify({ routes: busRoutesData, stops: busStops });
      const busLocations = JSON.stringify(initialBuses);
      
      const response = await optimizeRoute({
        ...values,
        busSchedules,
        busLocations,
      });
      setResult(response);
    } catch (e) {
      console.error(e);
      setError('Failed to optimize route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Route Optimizer</DialogTitle>
          <DialogDescription>
            Find the fastest route to your destination using real-time bus data.
          </DialogDescription>
        </DialogHeader>
        {!result && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ISBT Sector 17, Chandigarh" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Golden Temple, Amritsar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Optimizing...' : 'Find Fastest Route'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
        {result && (
          <div>
            <Card className="bg-secondary">
              <CardHeader>
                <CardTitle className="text-primary">Optimized Route Found</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-start gap-3">
                  <Route className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Route</h3>
                    <p className="text-sm">{result.optimizedRoute}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Estimated Arrival</h3>
                    <p className="text-sm">{result.eta}</p>
                  </div>
                </div>
                 <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Details</h3>
                    <p className="text-sm">{result.routeDetails}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  form.reset();
                }}
              >
                Plan Another Route
              </Button>
            </DialogFooter>
          </div>
        )}
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </DialogContent>
    </Dialog>
  );
};

export default RouteOptimizer;
