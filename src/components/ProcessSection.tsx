import { TimelineStep } from "./TimelineStep";

const steps = [
  {
    step: 1,
    title: "Daily Capture",
    frequency: "Every Day",
    description: "Quick, friction-free logging of what you did, decisions made, and outcomes observed. No overthinking—just capture the raw material."
  },
  {
    step: 2,
    title: "Weekly Reflection",
    frequency: "Each Week",
    description: "Review your entries with guided prompts. Add context, note patterns, and mark significant moments worth remembering."
  },
  {
    step: 3,
    title: "Quarterly Distillation",
    frequency: "Every Quarter",
    description: "AI synthesizes your weeks into themes and achievements. You validate and refine, building a curated record of growth."
  },
  {
    step: 4,
    title: "Artifact Generation",
    frequency: "On Demand",
    description: "Transform your distilled experiences into polished resume bullets, review talking points, or interview stories—grounded in real events."
  }
];

export const ProcessSection = () => {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            From lived experience to
            <br />
            <span className="text-gradient">trustworthy artifacts</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A progressive system that respects how memory works—capture while fresh, 
            reflect with distance, synthesize with intention.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          {steps.map((step, index) => (
            <TimelineStep key={step.step} {...step} isActive={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
};
