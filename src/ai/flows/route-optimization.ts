'use server';

/**
 * @fileOverview Route optimization AI agent.
 *
 * - optimizeRoute - A function that handles the route optimization process.
 * - OptimizeRouteInput - The input type for the optimizeRoute function.
 * - OptimizeRouteOutput - The return type for the optimizeRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeRouteInputSchema = z.object({
  currentLocation: z
    .string()
    .describe('The current location of the passenger.'),
  destination: z.string().describe('The desired destination of the passenger.'),
  busSchedules: z.string().describe('JSON string containing bus schedules with routes and times'),
  busLocations: z.string().describe('JSON string containing real-time bus locations'),
});
export type OptimizeRouteInput = z.infer<typeof OptimizeRouteInputSchema>;

const OptimizeRouteOutputSchema = z.object({
  optimizedRoute: z.string().describe('The fastest route to the destination.'),
  eta: z.string().describe('The estimated time of arrival.'),
  routeDetails: z.string().describe('A description of the route including bus numbers and transfer locations.'),
});
export type OptimizeRouteOutput = z.infer<typeof OptimizeRouteOutputSchema>;

export async function optimizeRoute(input: OptimizeRouteInput): Promise<OptimizeRouteOutput> {
  return optimizeRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeRoutePrompt',
  input: {schema: OptimizeRouteInputSchema},
  output: {schema: OptimizeRouteOutputSchema},
  prompt: `You are an expert route optimizer specializing in determining the fastest route using real-time bus locations and schedules.

You will use the current location and destination of the passenger, along with real-time bus locations and schedules to determine the fastest route to the destination.

Current Location: {{{currentLocation}}}
Destination: {{{destination}}}
Bus Schedules: {{{busSchedules}}}
Bus Locations: {{{busLocations}}}

Consider all available routes, transfer locations and real-time bus locations when determining the fastest route. Provide a detailed description of the route including bus numbers and transfer locations.  Also estimate the time of arrival.
`,
});

const optimizeRouteFlow = ai.defineFlow(
  {
    name: 'optimizeRouteFlow',
    inputSchema: OptimizeRouteInputSchema,
    outputSchema: OptimizeRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
