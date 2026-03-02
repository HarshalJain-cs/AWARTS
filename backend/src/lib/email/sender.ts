import { Resend } from 'resend';
import { env } from '../../env.js';
import { getUnsubscribeUrl } from './unsubscribe.js';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

export async function sendKudosEmail(params: {
  recipientId: string;
  recipientUsername: string;
  recipientEmail: string;
  senderUsername: string;
  postTitle: string;
  postId: string;
}) {
  const client = getResend();
  if (!client || !env.EMAIL_FROM) return;

  const postUrl = `${env.APP_URL}/post/${params.postId}`;
  const unsubscribeUrl = getUnsubscribeUrl(params.recipientId);

  await client.emails.send({
    from: env.EMAIL_FROM,
    to: params.recipientEmail,
    subject: `@${params.senderUsername} gave you kudos on AWARTS`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 24px; font-weight: 700; letter-spacing: -1px;">AWARTS</h2>
        <hr style="border-color: #f0f0f0; margin: 24px 0;" />
        <p>Hey @${params.recipientUsername},</p>
        <p><strong>@${params.senderUsername}</strong> gave your post a kudos!</p>
        ${params.postTitle ? `<div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin: 16px 0;"><p style="margin: 0; color: #666;">"${params.postTitle}"</p></div>` : ''}
        <a href="${postUrl}" style="display: inline-block; background: #DF561F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Post</a>
        <hr style="border-color: #f0f0f0; margin: 32px 0 16px;" />
        <p style="font-size: 12px; color: #999;">AWARTS &middot; Track your AI coding. &middot; <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a></p>
      </div>
    `,
  });
}

export async function sendCommentEmail(params: {
  recipientId: string;
  recipientUsername: string;
  recipientEmail: string;
  senderUsername: string;
  commentContent: string;
  postId: string;
}) {
  const client = getResend();
  if (!client || !env.EMAIL_FROM) return;

  const postUrl = `${env.APP_URL}/post/${params.postId}`;
  const unsubscribeUrl = getUnsubscribeUrl(params.recipientId);

  await client.emails.send({
    from: env.EMAIL_FROM,
    to: params.recipientEmail,
    subject: `@${params.senderUsername} commented on your post`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 24px; font-weight: 700;">AWARTS</h2>
        <hr style="border-color: #f0f0f0; margin: 24px 0;" />
        <p>Hey @${params.recipientUsername},</p>
        <p><strong>@${params.senderUsername}</strong> commented on your post:</p>
        <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #333;">"${params.commentContent.slice(0, 200)}"</p>
        </div>
        <a href="${postUrl}" style="display: inline-block; background: #DF561F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Post</a>
        <hr style="border-color: #f0f0f0; margin: 32px 0 16px;" />
        <p style="font-size: 12px; color: #999;">AWARTS &middot; <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a></p>
      </div>
    `,
  });
}

export async function sendFollowEmail(params: {
  recipientId: string;
  recipientUsername: string;
  recipientEmail: string;
  senderUsername: string;
}) {
  const client = getResend();
  if (!client || !env.EMAIL_FROM) return;

  const profileUrl = `${env.APP_URL}/u/${params.senderUsername}`;
  const unsubscribeUrl = getUnsubscribeUrl(params.recipientId);

  await client.emails.send({
    from: env.EMAIL_FROM,
    to: params.recipientEmail,
    subject: `@${params.senderUsername} started following you on AWARTS`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 24px; font-weight: 700;">AWARTS</h2>
        <hr style="border-color: #f0f0f0; margin: 24px 0;" />
        <p>Hey @${params.recipientUsername},</p>
        <p><strong>@${params.senderUsername}</strong> started following you!</p>
        <a href="${profileUrl}" style="display: inline-block; background: #DF561F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Profile</a>
        <hr style="border-color: #f0f0f0; margin: 32px 0 16px;" />
        <p style="font-size: 12px; color: #999;">AWARTS &middot; <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a></p>
      </div>
    `,
  });
}

export async function sendMentionEmail(params: {
  recipientId: string;
  recipientUsername: string;
  recipientEmail: string;
  senderUsername: string;
  postId: string;
}) {
  const client = getResend();
  if (!client || !env.EMAIL_FROM) return;

  const postUrl = `${env.APP_URL}/post/${params.postId}`;
  const unsubscribeUrl = getUnsubscribeUrl(params.recipientId);

  await client.emails.send({
    from: env.EMAIL_FROM,
    to: params.recipientEmail,
    subject: `@${params.senderUsername} mentioned you on AWARTS`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 24px; font-weight: 700;">AWARTS</h2>
        <hr style="border-color: #f0f0f0; margin: 24px 0;" />
        <p>Hey @${params.recipientUsername},</p>
        <p><strong>@${params.senderUsername}</strong> mentioned you in a comment!</p>
        <a href="${postUrl}" style="display: inline-block; background: #DF561F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Post</a>
        <hr style="border-color: #f0f0f0; margin: 32px 0 16px;" />
        <p style="font-size: 12px; color: #999;">AWARTS &middot; <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a></p>
      </div>
    `,
  });
}
