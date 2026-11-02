import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="primary">Go back home</Button>
      </Link>
    </section>
  );
}
