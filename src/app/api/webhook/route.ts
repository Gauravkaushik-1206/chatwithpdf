import { db } from "@/lib/db";
import { userSubscription } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request){
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;
    let event: Stripe.Event 
    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET as string);

    } catch (error) {
        return new Response(`Webhook Error: ${error}`, {
            status: 400,
        });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    // new Subscription created
    if(event.type == "checkout.session.completed"){
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );
        if(!session?.metadata?.userId){
            return new Response("No userId in metadata", {
                status: 400,
            });
        }

        await db.insert(userSubscription).values({
            userId: session.metadata.userId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        })
    }

    if(event.type == "invoice.payment_succeeded"){
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
        )

        await db.update(userSubscription).set({
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        })
        .where(eq(userSubscription.stripeSubscriptionId, subscription.id));
    }
     return new Response(null, {status: 200});

}