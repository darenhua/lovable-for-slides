"use client";

import { useMutation } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { client } from "@/utils/orpc";

const FileUpload = dynamic(() => import("@/components/kokonutui/file-upload"), {
	ssr: false,
});

const ACCEPTED_MIME_TYPES = [
	"application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
	"application/vnd.ms-powerpoint", // .ppt
	"application/vnd.ms-powerpoint.presentation.macroEnabled.12", // .pptm
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function UploadPage() {
	const router = useRouter();

	const createRecord = useMutation({
		mutationFn: (data: { filePath: string; fileName: string }) =>
			client.powerpoints.create(data),
	});

	const handleUploadSuccess = async (file: File) => {
		try {
			// Upload to Supabase Storage
			const fileName = `${Date.now()}-${file.name}`;
			const { data: uploadData, error: uploadError } = await supabase.storage
				.from("presentation")
				.upload(fileName, file);

			if (uploadError) {
				console.error("Upload to storage failed", uploadData, uploadError);
				throw new Error("Upload to storage failed");
			}

			// Create database record
			await createRecord.mutateAsync({
				filePath: uploadData.path,
				fileName: file.name,
			});

			// Redirect to home page
			router.push("/");
		} catch (error) {
			console.error("Upload error:", error);
		}
	};

	const handleUploadError = (error: { message: string; code: string }) => {
		console.error("File validation error:", error);
	};

	return (
		<div className="container mx-auto mt-12 px-8 py-8">
			<FileUpload
				onUploadSuccess={handleUploadSuccess}
				onUploadError={handleUploadError}
				acceptedFileTypes={ACCEPTED_MIME_TYPES}
				maxFileSize={MAX_FILE_SIZE}
				uploadDelay={1500}
				className="mx-auto w-full"
			/>
		</div>
	);
}
