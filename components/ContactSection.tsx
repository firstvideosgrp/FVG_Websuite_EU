import React, { useState } from 'react';
import { sendContactEmail } from '../services/appwrite';
import { useSettings } from '../contexts/SettingsContext';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

const ContactSection: React.FC = () => {
  const { settings } = useSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [responseMessage, setResponseMessage] = useState('');

  const mailEnabled = settings?.mailEnabled ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailEnabled) return;

    setStatus('sending');
    setResponseMessage('');

    try {
      await sendContactEmail({ name, email, message });
      setStatus('success');
      setResponseMessage('Thank you! Your message has been sent successfully.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      setStatus('error');
      setResponseMessage('Sorry, something went wrong. Please try again later.');
      console.error("Failed to send contact email:", error);
    }
  };

  const getStatusColor = () => {
    if (status === 'success') return 'bg-green-500/20 text-green-300';
    if (status === 'error') return 'bg-red-500/20 text-red-300';
    return 'hidden';
  }

  return (
    <section id="contact" className="py-20 md:py-32 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-[var(--secondary-color)]">
            Get In <span className="text-[var(--primary-color)]">Touch</span>
          </h2>
          <div className="w-24 h-1 bg-[var(--primary-color)] mx-auto mt-4"></div>
        </div>
        <div className="max-w-2xl mx-auto">
          <form className="space-y-6" onSubmit={handleSubmit}>
             <fieldset disabled={!mailEnabled} className="space-y-6 relative">
                {!mailEnabled && (
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-95 flex flex-col items-center justify-center rounded-md z-10 p-4 text-center border border-gray-700">
                        <i className="fas fa-tools text-4xl text-yellow-400 mb-4"></i>
                        <h3 className="text-xl font-bold text-gray-200">Function In Development</h3>
                        <p className="text-gray-400 mt-2">This function is currently in development.</p>
                    </div>
                )}
                <div className="relative">
                  <label htmlFor="contact-name" className="sr-only">Your Name</label>
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                    <i className="fas fa-user"></i>
                  </span>
                  <input id="contact-name" type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-md py-3 px-4 pl-12 text-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" />
                </div>
                <div className="relative">
                  <label htmlFor="contact-email" className="sr-only">Your Email</label>
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                    <i className="fas fa-envelope"></i>
                  </span>
                  <input id="contact-email" type="email" placeholder="Your Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-md py-3 px-4 pl-12 text-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" />
                </div>
                 <div className="relative">
                  <label htmlFor="contact-message" className="sr-only">Your Message</label>
                  <span className="absolute top-4 left-0 flex items-center pl-4 text-gray-500">
                    <i className="fas fa-pen"></i>
                  </span>
                  <textarea id="contact-message" placeholder="Your Message" rows={5} value={message} onChange={e => setMessage(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-md py-3 px-4 pl-12 text-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"></textarea>
                </div>
                {responseMessage && (
                  <div role="alert" className={`p-4 rounded-md text-center text-sm font-medium ${getStatusColor()}`} aria-live="polite">
                    {responseMessage}
                  </div>
                )}
                <button type="submit" disabled={status === 'sending' || !mailEnabled} className="w-full bg-[var(--primary-color)] text-gray-900 font-bold py-3 px-8 rounded-full uppercase tracking-wider hover:brightness-110 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {status === 'sending' ? (
                    <>
                      <i className="fas fa-spinner animate-spin"></i>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <i className="fas fa-paper-plane"></i>
                    </>
                  )}
                </button>
             </fieldset>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;