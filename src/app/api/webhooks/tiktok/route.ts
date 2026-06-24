import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received TikTok Webhook payload:", JSON.stringify(body));

    // TikTok direct post event type
    const event = body.event;
    const content = body.content;

    if (event === "post.publish.status" && content) {
      const publishId = content.publish_id;
      const status = content.status; // "SUCCESS" or "FAILED"
      const shareId = content.share_id;
      const errorMsg = content.error_message || content.fail_reason;

      if (!publishId) {
        return NextResponse.json({ error: "Missing publish_id" }, { status: 400 });
      }

      // Query PublishingLog across all workspaces since webhook is global using Admin SDK collectionGroup
      const q = adminDb.collectionGroup("publishing_logs").where("platformPostId", "==", publishId);
      const querySnapshot = await q.get();

      if (querySnapshot.empty) {
        console.warn(`No publishing log found matching platformPostId: ${publishId}`);
        return NextResponse.json({ status: "ignored", message: "No matching post found" });
      }

      const statusMap = {
        SUCCESS: "success",
        FAILED: "failed",
      };

      const finalStatus = statusMap[status as "SUCCESS" | "FAILED"] || "failed";

      // Update matching logs using Admin SDK
      const promises = querySnapshot.docs.map(async (document) => {
        const updateData: Record<string, any> = {
          publishStatus: finalStatus,
          status: finalStatus,
          completedAt: new Date(),
        };

        if (finalStatus === "success" && shareId) {
          updateData.platformPostId = shareId;
          updateData.platformPostUrl = `https://www.tiktok.com/t/${shareId}/`;
        }

        if (finalStatus === "failed") {
          updateData.errorCode = "TIKTOK_ASYNC_FAILED";
          updateData.errorMessage = errorMsg || "Video processing failed on TikTok's end.";
        }

        await document.ref.update(updateData);
        console.log(`Updated TikTok log ${document.id} status to ${finalStatus}`);
      });

      await Promise.all(promises);
    }

    // TikTok requires returning a 200 OK with empty body or JSON ack
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("TikTok Webhook handler error:", err);
    return NextResponse.json({ error: err.message || "Internal Webhook Error" }, { status: 500 });
  }
}
