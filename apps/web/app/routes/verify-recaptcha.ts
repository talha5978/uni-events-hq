import type { ActionFunctionArgs } from "react-router";
import { verifyRecaptcha } from "~/components/ReCaptcha/GoogleReCaptcha";

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();

	const recaptchaToken = formData.get("recaptchaToken") as string | null;

	if (!recaptchaToken) {
		return new Response(JSON.stringify({ success: false, error: "Recaptcha token not found" }), {
			status: 400,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	const captchaResult = await verifyRecaptcha(recaptchaToken);

	if (!captchaResult.success) {
		console.error(captchaResult);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Captcha verification failed",
			}),
			{
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}

	return new Response(
		JSON.stringify({
			success: true,
		}),
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
};
