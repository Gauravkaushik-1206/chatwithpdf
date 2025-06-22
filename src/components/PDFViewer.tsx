type props = {
    pdf_url: string;
}
export default function PDFViewer({pdf_url}:props) {
    return (
        <iframe src={`https://docs.google.com/gview?url=${pdf_url}&embedded=true`} className="w-full h-full">
            
        </iframe>
    )
}