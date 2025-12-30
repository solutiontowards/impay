import { Construction, Clock } from "lucide-react";

const ComingSoonSection = ({
  title = "Section Under Development",
  subtitle = "We’re working on something great",
  description = "This section is currently under development and will be available soon. Stay tuned for updates.",
}) => {
  return (
    <section className="w-full px-6 md:px-12 lg:px-20 py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-white p-10 md:p-14 text-center shadow-sm hover:shadow-md transition">
          
          {/* Background Accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-transparent to-transparent opacity-70 pointer-events-none" />

          {/* Icon */}
          <div className="relative z-10 flex justify-center mb-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600">
              <Construction className="h-8 w-8" />
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              {title}
            </h2>

            <p className="text-lg text-red-600 font-medium">
              {subtitle}
            </p>

            <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
              {description}
            </p>
          </div>

          {/* Footer Hint */}
          <div className="relative z-10 mt-8 flex justify-center items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Launching soon</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComingSoonSection;
