import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

/* Icons that mean "back" or "next" point the other way in RTL. Icons that mean
   a thing rather than a direction (download, mail, star) are left alone. */

export function BackIcon(props) {
  const { isRtl } = useI18n();
  const Icon = isRtl ? ArrowRight : ArrowLeft;
  return <Icon {...props} />;
}

export function ForwardIcon(props) {
  const { isRtl } = useI18n();
  const Icon = isRtl ? ArrowLeft : ArrowRight;
  return <Icon {...props} />;
}

export function PreviousIcon(props) {
  const { isRtl } = useI18n();
  const Icon = isRtl ? ChevronRight : ChevronLeft;
  return <Icon {...props} />;
}

export function NextIcon(props) {
  const { isRtl } = useI18n();
  const Icon = isRtl ? ChevronLeft : ChevronRight;
  return <Icon {...props} />;
}
