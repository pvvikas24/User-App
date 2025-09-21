'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Logo from './logo';
import { busStops } from '@/lib/data';
import { ArrowRight } from 'lucide-react';

const formSchema = z.object({
  start: z.string().min(1, 'Please select a starting point.'),
  destination: z.string().min(1, 'Please select a destination.'),
}).refine(data => data.start !== data.destination, {
    message: "Start and destination cannot be the same.",
    path: ["destination"],
});

const SearchPage = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: '',
      destination: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    router.push(`/buses?start=${values.start}&destination=${values.destination}`);
  };

  const stopNames = React.useMemo(() => busStops.map(stop => stop.name), []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="absolute top-8 left-8">
            <Logo />
        </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Where are you going?</CardTitle>
          <CardDescription>Find a bus to your destination.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a starting bus stop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stopNames.map(stop => (
                            <SelectItem key={`start-${stop}`} value={stop}>{stop}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a destination bus stop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stopNames.map(stop => (
                            <SelectItem key={`dest-${stop}`} value={stop}>{stop}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Search Buses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchPage;
