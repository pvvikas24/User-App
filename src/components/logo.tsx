import { Bus } from 'lucide-react';
import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <Bus className="h-8 w-8 text-primary" />
      <h1 className="text-xl font-bold text-foreground group-data-[collapsible=icon]/sidebar-wrapper:hidden">
        Punjab Roadways
      </h1>
    </div>
  );
};

export default Logo;
