export default function LoyaltyBanner() {
  return (
    <div className="border-y border-[#DEDAD1] bg-[#F2F0EA] py-3 px-4 text-center">
      <p className="text-[12.5px] text-[#3A3631]">
        <span className="font-semibold text-[#181614]">2 pièces dans le même panier</span>
        {" "}= livraison offerte
        <span className="mx-3 text-[#DEDAD1]">·</span>
        <span className="font-semibold text-[#181614]">3 pièces achetées</span>
        {" "}= 1 print ou une commission dessin offert 🎁
      </p>
    </div>
  );
}
