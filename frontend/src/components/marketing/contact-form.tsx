'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

/**
 * Validation lives in a zod schema so the same rules can move to the shared package and be
 * reused by the API when `POST /contact` exists. Today the submit is local only.
 */
const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().trim().email('Enter a valid email address').or(z.literal('')),
  topic: z.enum(['hiring', 'work', 'report', 'partnership', 'other'], {
    message: 'Choose what this is about',
  }),
  message: z.string().trim().min(20, 'Please give us a little more detail (20 characters)'),
});

type ContactValues = z.infer<typeof contactSchema>;

const TOPICS: { value: ContactValues['topic']; label: string }[] = [
  { value: 'hiring', label: 'I want to hire workers' },
  { value: 'work', label: 'I am looking for work' },
  { value: 'report', label: 'I want to report a job or account' },
  { value: 'partnership', label: 'Partnership or press' },
  { value: 'other', label: 'Something else' },
];

export function ContactForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', phone: '', email: '', message: '' },
  });

  const topic = useWatch({ control, name: 'topic' });

  async function onSubmit(): Promise<void> {
    // Placeholder for `POST /contact`. Deliberately does not pretend to reach a server.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-success-subtle border-success/25 rounded-lg border p-6 text-center">
        <CheckCircle2 className="text-success mx-auto size-8" aria-hidden />
        <h2 className="mt-3 font-semibold">Thanks — your message is ready to send</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          The contact API is not connected yet, so nothing left your browser. Once the backend is
          wired up this form will post to <code className="font-mono text-xs">/contact</code>.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setSent(false)}>
          Write another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="bg-card space-y-4 rounded-lg border p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            {...register('name')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            autoComplete="name"
          />
          {errors.name ? (
            <p id="name-error" className="text-destructive text-sm">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            inputMode="numeric"
            {...register('phone')}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            autoComplete="tel-national"
            placeholder="98XXXXXXXX"
          />
          {errors.phone ? (
            <p id="phone-error" className="text-destructive text-sm">
              {errors.phone.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">
          Email <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input id="email" type="email" {...register('email')} autoComplete="email" />
        {errors.email ? <p className="text-destructive text-sm">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="topic">What is this about?</Label>
        <Select
          value={topic}
          onValueChange={(value) =>
            setValue('topic', value as ContactValues['topic'], { shouldValidate: true })
          }
        >
          <SelectTrigger id="topic" className="w-full" aria-invalid={Boolean(errors.topic)}>
            <SelectValue placeholder="Choose a topic" />
          </SelectTrigger>
          <SelectContent>
            {TOPICS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.topic ? <p className="text-destructive text-sm">{errors.topic.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={5}
          {...register('message')}
          aria-invalid={Boolean(errors.message)}
          placeholder="Tell us what you need — how many workers, which trade, which area, and by when."
        />
        {errors.message ? (
          <p className="text-destructive text-sm">{errors.message.message}</p>
        ) : null}
      </div>

      <Button type="submit" variant="action" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>

      <p className="text-muted-foreground text-xs">
        We use your number only to reply to this message.
      </p>
    </form>
  );
}
