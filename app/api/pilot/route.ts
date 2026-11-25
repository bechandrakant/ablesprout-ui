import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PilotSchema = z.object({
  schoolName: z.string().trim().min(2).max(200),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(100),
  students: z.coerce.number().int().min(1).max(100000).optional(),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(0).optional(), // honeypot: real people leave it empty
});

/** "Become a pilot school" form. Forwards to PILOT_WEBHOOK_URL when configured, else logs. */
export async function POST(req: NextRequest) {
  const parsed = PilotSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Please check the form", details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } },
      { status: 400 },
    );
  }
  const { website: _honeypot, ...lead } = parsed.data;
  void _honeypot;
  const webhook = process.env.PILOT_WEBHOOK_URL;
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pilot_school_request", receivedAt: new Date().toISOString(), ...lead }),
    }).catch(() => null);
    if (!res?.ok) {
      return NextResponse.json({ error: { code: "UPSTREAM", message: "Could not submit right now. Please email hello@ablesprout.com." } }, { status: 502 });
    }
  } else {
    console.info("[pilot-request]", JSON.stringify({ ...lead, receivedAt: new Date().toISOString() }));
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
