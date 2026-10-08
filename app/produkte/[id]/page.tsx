import { ProductForm } from "@/components/pages/products";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <ProductForm key={id} existing productId={id}/>;
}
