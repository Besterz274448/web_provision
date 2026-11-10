interface HeadingProps {
  title: string;
  description: string;
}

export function Heading({ title, description }: HeadingProps) {
  return (
    <div>
      <h1 className='text-2xl font-semibold'>{title}</h1>
      <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
    </div>
  );
}
