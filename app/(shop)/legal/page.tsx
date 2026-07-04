export default function LegalPage() {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-8 py-16">
      <h1 className="font-serif text-[34px] text-[#181614] mb-2">Mentions légales & CGV</h1>
      <p className="text-xs text-[#8C8780] mb-12">Dernière mise à jour : {today}</p>

      {/* MENTIONS LÉGALES */}
      <section className="mb-14">
        <h2 className="font-serif text-[22px] text-[#181614] mb-6 pb-3 border-b border-[#DEDAD1]">
          Mentions légales
        </h2>

        <div className="flex flex-col gap-6 text-[14.5px] text-[#3A3631] leading-relaxed">
          <div>
            <h3 className="font-semibold text-[#181614] mb-1">Éditeur du site</h3>
            <p>
              Damien Rul — particulier<br />
              Adresse : Montpellier (34), France<br />
              E-mail : <a href="mailto:damienrul34@gmail.com" className="underline hover:text-[#B23A24]">damienrul34@gmail.com</a><br />
              Instagram / TikTok : @drdssin_
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-1">Directeur de la publication</h3>
            <p>Damien Rul</p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-1">Hébergement</h3>
            <p>
              Ce site est hébergé par un prestataire tiers. Pour toute demande relative à
              l&rsquo;hébergement, vous pouvez contacter l&rsquo;éditeur à l&rsquo;adresse
              e-mail ci-dessus.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-1">Propriété intellectuelle</h3>
            <p>
              Toutes les œuvres présentées sur ce site (dessins, illustrations, planches de bande
              dessinée, reproductions photographiques de ces œuvres) sont la propriété exclusive
              de Damien Rul et sont protégées par le droit d&rsquo;auteur français (Code de la
              propriété intellectuelle). Toute reproduction, représentation, modification ou
              exploitation, totale ou partielle, de ces œuvres sans autorisation écrite préalable
              est strictement interdite.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-1">Données personnelles (RGPD)</h3>
            <p>
              Les données collectées lors d&rsquo;une commande (nom, adresse e-mail, adresse
              postale) sont utilisées exclusivement pour le traitement et la livraison de la
              commande. Elles ne sont jamais transmises à des tiers à des fins commerciales. Les
              paiements par carte bancaire sont traités directement par Stripe, qui bénéficie de
              la certification PCI-DSS — Damien Rul n&rsquo;a à aucun moment accès à vos
              coordonnées bancaires. Conformément au Règlement général sur la protection des
              données (RGPD), vous disposez d&rsquo;un droit d&rsquo;accès, de rectification et
              de suppression de vos données. Pour exercer ce droit, contactez-nous à
              l&rsquo;adresse e-mail ci-dessus.
            </p>
          </div>
        </div>
      </section>

      {/* CGV */}
      <section>
        <h2 className="font-serif text-[22px] text-[#181614] mb-6 pb-3 border-b border-[#DEDAD1]">
          Conditions générales de vente
        </h2>

        <div className="flex flex-col gap-8 text-[14.5px] text-[#3A3631] leading-relaxed">

          <div>
            <h3 className="font-semibold text-[#181614] mb-2">Article 1 — Objet</h3>
            <p>
              Les présentes conditions générales de vente (CGV) régissent les ventes de produits
              artistiques (reproductions numérotées, œuvres originales, bandes dessinées,
              fichiers numériques) et les commandes de créations sur mesure réalisées par Damien
              Rul, artiste indépendant basé à Montpellier (France), via le site internet
              damienrulatelier.fr. Toute commande implique l&rsquo;acceptation pleine et entière
              des présentes CGV.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-2">Article 2 — Produits</h3>
            <p>
              Les produits proposés sont des œuvres artistiques originales à l&rsquo;encre,
              des reproductions imprimées en édition limitée et numérotée (giclée ou tirage
              pigmentaire sur papier ou toile), des bandes dessinées originales, et des fichiers
              numériques. Chaque reproduction est signée à la main par l&rsquo;artiste. Les
              caractéristiques essentielles de chaque produit (dimensions, technique, numéro
              d&rsquo;édition, options de réception) sont précisées sur la fiche produit
              correspondante.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-2">Article 3 — Prix</h3>
            <p>
              Les prix sont indiqués en euros. En tant que particulier non assujetti à la TVA
              (article 293 B du Code général des impôts — &laquo;&nbsp;TVA non applicable,
              art. 293 B du CGI&nbsp;&raquo;), aucune taxe n&rsquo;est ajoutée aux prix affichés.
              Les frais de livraison sont indiqués séparément au moment de la commande. Une
              livraison gratuite est offerte pour toute commande comprenant au moins deux articles
              dans le même panier.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-2">Article 4 — Commande et paiement</h3>
            <p>
              Les commandes sont passées directement via le site, par carte bancaire (Stripe)
              ou PayPal. Le paiement est sécurisé et traité intégralement par ces prestataires.
              La commande est confirmée dès réception du paiement. Un e-mail de confirmation
              est envoyé à l&rsquo;adresse fournie lors de la commande. Le bouton de validation
              est intitulé « Payer [montant] par carte » ou équivalent, conformément aux
              obligations légales.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-2">Article 5 — Livraison</h3>
            <p>
              Les commandes sont expédiées depuis Montpellier (France) vers la France
              métropolitaine, la Belgique, la Suisse, le Luxembourg et Monaco. Les délais
              d&rsquo;expédition sont de 3 à 10 jours ouvrés à compter de la confirmation du
              paiement (délai pouvant être allongé si une dédicace ou création personnalisée
              est incluse dans la commande). La livraison s&rsquo;effectue via Mondial Relay
              (point relais) ou La Poste (domicile), au choix du client. En cas de commande
              incluant un fichier numérique, celui-ci est envoyé par e-mail dans un délai de
              3 à 5 jours ouvrés.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-2">
              Article 6 — Droit de rétractation
            </h3>
            <p>
              Conformément à l&rsquo;article L221-18 du Code de la consommation, le client
              particulier dispose d&rsquo;un délai de 14 jours à compter de la réception du
              produit pour exercer son droit de rétractation, sans avoir à justifier de motif.
            </p>
            <p className="mt-2">
              <strong>Exception importante :</strong> les œuvres originales uniques, les
              reproductions dédicacées sur demande personnelle du client, et les fichiers
              numériques téléchargés ou envoyés sont expressément exclus du droit de
              rétractation, conformément aux articles L221-28 3° et 13° du Code de la
              consommation (biens confectionnés selon les spécifications du consommateur ou
              nettement personnalisés ; contenu numérique non fourni sur un support matériel).
            </p>
            <p className="mt-2">
              Pour exercer votre droit de rétractation sur les produits éligibles, contactez-nous
              par e-mail à damienrul34@gmail.com en indiquant votre numéro de commande. Les frais
              de retour sont à la charge du client. Le remboursement sera effectué dans les 14
              jours suivant réception du produit retourné, dans le même moyen de paiement que
              celui utilisé lors de la commande.
            </p>
            <p className="mt-3 p-3 bg-[#F2F0EA] border border-[#DEDAD1] text-sm">
              <strong>Formulaire de rétractation :</strong> Pour exercer votre droit de
              rétractation, vous pouvez utiliser le formulaire ci-dessous ou envoyer toute
              déclaration dénuée d&rsquo;ambiguïté à damienrul34@gmail.com :<br /><br />
              « Je notifie par la présente ma rétractation du contrat portant sur la commande
              du [date de commande], reçue le [date de réception]. Nom : [votre nom].
              Adresse : [votre adresse]. Signature : [si formulaire papier]. Date : [date]. »
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-2">Article 7 — Garanties légales</h3>
            <p>
              Tous les produits bénéficient de la garantie légale de conformité (articles
              L217-4 et suivants du Code de la consommation) et de la garantie légale contre
              les vices cachés (articles 1641 et suivants du Code civil). En cas de défaut de
              conformité ou de vice caché constaté, contactez-nous par e-mail pour trouver une
              solution amiable (remplacement, remboursement).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-2">
              Article 8 — Médiation de la consommation
            </h3>
            <p>
              En cas de litige non résolu à l&rsquo;amiable, le client peut recourir
              gratuitement à un médiateur de la consommation. Nous recommandons la plateforme
              européenne de règlement en ligne des litiges :{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#B23A24]"
              >
                ec.europa.eu/consumers/odr
              </a>
              .
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[#181614] mb-2">
              Article 9 — Droit applicable et juridiction
            </h3>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties
              rechercheront une solution amiable avant tout recours judiciaire. À défaut,
              les tribunaux français seront seuls compétents.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}
