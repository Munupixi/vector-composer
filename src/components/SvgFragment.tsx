import { memo, useMemo } from 'react';
import { namespaceIds } from '../svg';

/** Parse only when content changes, rather than on every pointer movement. */
export default memo(function SvgFragment({ markup, prefix }: { markup: string; prefix: string }) {
  const html = useMemo(() => namespaceIds(markup, prefix), [markup, prefix]);
  return <g dangerouslySetInnerHTML={{ __html: html }} />;
});
