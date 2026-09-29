import Shell from "@/components/shell";
import DocumentDetail from "@/components/document-detail";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Shell><DocumentDetail kind="offerte" id={id}/></Shell>}
