"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "Quelle est la différence entre une œuvre originale et une reproduction ?",
    answer:
      "La œuvre originale est l'œuvre que j'ai réalisée à la main, en un seul exemplaire — il n'y en a qu'une au monde. La reproduction est un tirage imprimé de cette œuvre, numéroté selon l'édition (par exemple 12/50). Sauf mention contraire, ce que tu achètes est une reproduction.",
  },
  {
    question: "Les tirages sont-ils signés et numérotés ?",
    answer:
      "Oui. Chaque tirage est numéroté selon son édition, signé à la main, et peut être dédicacé sur demande avant l'envoi.",
  },
  {
    question: "Quels formats puis-je choisir ?",
    answer:
      "Selon le produit, je propose plusieurs formats papier (du A6 au A2) et parfois une version toile. Les formats réellement disponibles pour chaque œuvre sont indiqués directement sur sa fiche.",
  },
  {
    question: "Combien de temps avant de recevoir ma commande ?",
    answer:
      "Pour un tirage simple, je prépare l'envoi en quelques jours. Si tu demandes une dédicace, j'ajoute le temps de la dessiner avant expédition — généralement 3 à 5 jours au total.",
  },
  {
    question: "Comment fonctionne la livraison ?",
    answer:
      "Tu peux choisir Mondial Relay (en point relais) ou un envoi postal à domicile. Pour Mondial Relay, je te recontacte par e-mail juste après ta commande pour connaître le point relais où tu souhaites récupérer ton colis.",
  },
  {
    question: "Comment fonctionnent les commissions ?",
    answer:
      "Tu choisis une formule (Souvenir, Reproduction, ou Sur mesure pour un devis), tu me décris ton projet et tu peux joindre une photo de référence. Je te recontacte ensuite par e-mail pour échanger sur les détails avant de réaliser le dessin.",
  },
  {
    question: "Puis-je payer en plusieurs fois ou demander un acompte ?",
    answer:
      "Pour les tirages et la BD, le paiement se fait en une fois au moment de la commande. Pour une commission sur mesure, je peux te proposer un acompte une fois le prix discuté ensemble.",
  },
  {
    question: "Le paiement est-il sécurisé ?",
    answer:
      "Oui — les paiements passent directement par Stripe ou PayPal, qui gèrent eux-mêmes tes données bancaires. Je n'ai jamais accès à ton numéro de carte.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="border-b border-[#DEDAD1]">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-serif text-[16px] md:text-[17px] text-[#181614]">
                {item.question}
              </span>
              <span
                className={`flex-shrink-0 text-xl text-[#B23A24] transition-transform duration-200 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-200"
              style={{ maxHeight: isOpen ? "400px" : "0px" }}
            >
              <p className="text-[14.5px] text-[#3A3631] leading-relaxed pb-5 pr-8">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
