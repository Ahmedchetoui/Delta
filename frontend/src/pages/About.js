import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            À propos de Delta Fashion
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Votre destination de confiance pour la mode et le style depuis 2020
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Notre Histoire
            </h2>
            <p className="text-gray-600 mb-4">
              Delta Fashion est née de la passion pour la mode et du désir de rendre
              les tendances accessibles à tous. Fondée en 2020, notre entreprise a
              rapidement évolué pour devenir une référence dans l'e-commerce de la mode en Tunisie.
            </p>
            <p className="text-gray-600 mb-4">
              Nous croyons que la mode est un moyen d'expression personnelle et que
              chacun mérite de se sentir bien dans ses vêtements, quel que soit son budget.
            </p>
            <p className="text-gray-600">
              Notre engagement envers la qualité, l'accessibilité et le service client
              exceptionnel nous distingue dans l'industrie de la mode en ligne.
            </p>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl group">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Notre équipe"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent"></div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Nos Valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Qualité
              </h3>
              <p className="text-gray-600">
                Nous sélectionnons soigneusement chaque produit pour garantir
                la meilleure qualité à nos clients.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Accessibilité
              </h3>
              <p className="text-gray-600">
                La mode de qualité doit être accessible à tous, c'est pourquoi
                nous proposons des prix compétitifs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Service Client
              </h3>
              <p className="text-gray-600">
                Notre équipe dédiée est là pour vous accompagner à chaque étape
                de votre expérience d'achat.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Notre Équipe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Ahmed Ben Ali', role: 'Fondateur & CEO', image: '👨‍💼' },
              { name: 'Fatma Khelil', role: 'Directrice Marketing', image: '👩‍💼' },
              { name: 'Mohamed Trabelsi', role: 'Responsable Logistique', image: '👨‍🔧' },
              { name: 'Aicha Mansouri', role: 'Service Client', image: '👩‍💻' }
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                  {member.image}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-blue-600 rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold text-center mb-8">
            Delta Fashion en Chiffres
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Clients satisfaits</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5K+</div>
              <div className="text-blue-100">Produits disponibles</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Service client</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Satisfaction garantie</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
