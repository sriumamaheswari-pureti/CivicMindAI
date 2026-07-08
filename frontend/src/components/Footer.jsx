import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* GVMC Branding Column */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-bold flex items-center">
              <span className="mr-2">🏙️</span> GVMC Visakhapatnam
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Greater Visakhapatnam Municipal Corporation is committed to delivering quality municipal services, smart city infrastructures, and clean public hygiene across Vizag.
            </p>
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} Greater Visakhapatnam Municipal Corporation. All Rights Reserved.
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-4">
            <h3 className="text-white text-md font-bold uppercase tracking-wider">GVMC Head Office</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tenneti Bhavanam</strong><br />
                  Asilmetta Junction, Visakhapatnam,<br />
                  Andhra Pradesh, 530003
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary-500" />
                <span>support-gvmc@ap.gov.in</span>
              </li>
            </ul>
          </div>

          {/* Helpline Column */}
          <div className="space-y-4">
            <h3 className="text-white text-md font-bold uppercase tracking-wider">Emergency Helplines</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-green-500" />
                <span>
                  <strong>Toll-Free Grievance:</strong> 1800-425-00009
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span>
                  <strong>GVMC Control Room:</strong> 0891-2568585
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-orange-500" />
                <span>
                  <strong>Disaster Management:</strong> 0891-2562525
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
