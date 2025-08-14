import { Link } from "react-router-dom";
import {
  Merge,
  Split,
  Minimize2,
  Image,
  FileText,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

const Home = () => {
  const features = [
    {
      icon: Merge,
      title: "Merge PDFs",
      description: "Combine multiple PDF files into a single document",
      path: "/merge",
      color: "text-blue-600",
    },
    {
      icon: Split,
      title: "Split PDFs",
      description: "Extract specific pages or split into separate files",
      path: "/split",
      color: "text-green-600",
    },
    {
      icon: Minimize2,
      title: "Compress PDFs",
      description: "Reduce file size while maintaining quality",
      path: "/compress",
      color: "text-purple-600",
    },
    {
      icon: Image,
      title: "Convert PDFs",
      description: "Convert PDF pages to images (PNG, JPG)",
      path: "/convert",
      color: "text-orange-600",
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Quick and efficient PDF operations",
    },
    {
      icon: Shield,
      title: "Secure",
      description: "Files are automatically deleted after processing",
    },
    {
      icon: Clock,
      title: "No Registration",
      description: "Use all features without creating an account",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Online PDF Toolkit
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Merge, split, compress, and convert your PDF files with ease. All
          operations are performed securely in your browser.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Link
              key={index}
              to={feature.path}
              className="card hover:shadow-lg transition-shadow duration-200 group"
            >
              <div className="text-center">
                <div
                  className={`inline-flex p-3 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors mb-4`}
                >
                  <Icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Why Choose Our PDF Toolkit?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex p-3 rounded-full bg-primary-100 mb-4">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Get Started Now
        </h2>
        <p className="text-gray-600 mb-6">
          Choose a tool above to begin working with your PDF files
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/merge" className="btn btn-primary">
            <Merge className="h-4 w-4 mr-2" />
            Merge PDFs
          </Link>
          <Link to="/split" className="btn btn-secondary">
            <Split className="h-4 w-4 mr-2" />
            Split PDF
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
