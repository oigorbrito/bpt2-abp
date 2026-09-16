import { NextRequest, NextResponse } from "next/server";
import { recordWhatsAppLead } from "@/lib/leads";
import { getPublicListing, whatsAppUrl } from "@/lib/public-listings";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const listingId = formData.get("listingId");

  if (typeof listingId !== "string" || listingId.length === 0) {
    return new NextResponse("listingId is required", { status: 400 });
  }

  const listing = await getPublicListing(listingId);
  if (!listing) {
    return new NextResponse("Listing not found", { status: 404 });
  }

  const contactUrl = whatsAppUrl(listing.seller.whatsAppNumber);
  // Security guardrail: Validate redirect URL prefix to prevent potential open redirect vulnerabilities.
  if (!contactUrl || !contactUrl.startsWith("https://wa.me/")) {
    return new NextResponse("Contact unavailable", { status: 404 });
  }

  await recordWhatsAppLead(listing.id, request.headers.get("authorization"));
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ url: contactUrl });
  }
  return NextResponse.redirect(contactUrl, 303);
}
