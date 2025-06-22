"use client";
import { uploadFileToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FileUpload() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });

      return response.data;
    },
  });
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      console.log(acceptedFiles);
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          "File size exceeds 10MB limit. Please upload a smaller file."
        );
        return;
      }
      try {
        setUploading(true);
        const data = await uploadFileToS3(file);
        if (!data?.file_key || !data?.file_name) {
          alert("Error uploading file. Please try again.");
          toast.error("Error uploading file. Please try again.");
          return;
        }
        mutate(data, {
          onSuccess: ({chat_id}) => {
            // console.log("File uploaded and chat created successfully:", data);
            toast.success("File uploaded and chat created successfully!");
            router.push(`/chat/${chat_id}`);
              
          },
          onError: (error) => {
            console.error("Error creating chat:", error);
            toast.error("Error creating chat. Please try again.");
          },
        });
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally{
        setUploading(false);
      }
    },
  });

  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        {uploading || isPending ? (
          <>
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin"></Loader2>
            <p className="text-sm mt-2 text-slate-400">
                spilling Tea to chatgpt ...
            </p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500"></Inbox>
            <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
          </>
        )}
      </div>
    </div>
  );
}
