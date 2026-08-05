import React from 'react';
import Link from 'next/link';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-semibold tracking-tight text-gray-900 mb-4">anti-coach</h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            A contrarian AI chat partner. Pushback over pep talks.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/auth/signin"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get started
            </Link>
            <Link
              href="/chat"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Open chat
            </Link>
          </div>
        </header>

        <main className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">What it is</h2>
          <p className="text-gray-600 mb-6">
            Sign in, pick a model, and talk. anti-coach challenges easy answers and
            lazy thinking — without tools, documents, or workspaces. Just you and the chat.
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Private account — no shared workspace</li>
            <li>Choose from supported language models</li>
            <li>Conversation history across sessions</li>
          </ul>
        </main>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} anti-coach</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
