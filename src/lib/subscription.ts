import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { userSubscription } from "./db/schema";
import { eq } from "drizzle-orm";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

type UserSubscription = {
    userId: string;
    stripeCustomerId: string | null;
    stripePriceId: string | null;
    stripeCurrentPeriodEnd: Date | null;
}

export const checkSubscription = async ()=>{
    const { userId } = await auth();
    if(!userId){
        return false;
    }

    const _userSubscription = await db.select().from(userSubscription).where(eq(userSubscription.userId, userId));

    if(_userSubscription[0]){
        return false
    }

    const userSubscriptions: UserSubscription = _userSubscription[0];

    const isValid = userSubscriptions.stripePriceId && userSubscriptions.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

    return !!isValid;


}