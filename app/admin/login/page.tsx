import Link from "next/link";
import {
  FiNavigation,
  FiFileText,
  FiImage,
  FiKey,
  FiArrowLeft,
} from "react-icons/fi";
import { Login } from "@/components/admin-auth";
export default function Page() {
  return (
    <div className="admin-login-page">
      <section className="admin-login-story">
        <Link className="admin-brand" href="/">
          <span className="admin-brand-icon">
            <FiNavigation aria-hidden />
          </span>
          <span>
            Dhaka Bus Routes<small>EDITORIAL WORKSPACE</small>
          </span>
        </Link>
        <div>
          <p className="eyebrow">BETTER STORIES. EASIER JOURNEYS.</p>
          <h2>
            Your city.
            <br />
            Your stories.
          </h2>
          <p>One workspace to create helpful guides and keep Dhaka moving.</p>
          <ul>
            <li>
              <FiFileText aria-hidden /> Write and publish articles
            </li>
            <li>
              <FiImage aria-hidden /> Organize your media library
            </li>
            <li>
              <FiKey aria-hidden /> Connect with an API key
            </li>
          </ul>
        </div>
        <span>Made for the people who know Dhaka.</span>
      </section>
      <section className="admin-login-form-section">
        <div className="admin-login-form">
          <Link className="admin-login-back" href="/">
            <FiArrowLeft aria-hidden /> Back to website
          </Link>
          <p className="eyebrow">WELCOME BACK</p>
          <h1>Sign in to your workspace</h1>
          <p>Use your editorial account to continue.</p>
          <Login />
        </div>
        <p className="admin-login-footer">
          Dhaka Bus Routes · Editorial access
        </p>
      </section>
    </div>
  );
}
