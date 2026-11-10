import type { SurveyInfo } from '../api/types';
import { formatDateTime } from '../lib/format';
import { answerText } from '../lib/survey';

/**
 * Every answer as the survey sent it, not only the ones with a column. So a question added to the
 * form shows up here without a change, and a person always sees what the customer really wrote.
 */
export function SurveyAnswers({ survey }: { survey: SurveyInfo }) {
  return (
    <section aria-labelledby='survey-title'>
      <h2 id='survey-title' className='mb-2 font-semibold'>
        ข้อมูลจากแบบสำรวจ
      </h2>
      <dl className='grid rounded-lg border px-4 py-1 sm:grid-cols-2 sm:gap-x-6'>
        {survey.answers.map((answer) => {
          const text = answerText(answer, formatDateTime);
          return (
            <div
              key={answer.question_id}
              className='flex min-w-0 flex-col gap-0.5 border-t py-2 first:border-t-0 sm:nth-2:border-t-0'
            >
              <dt className='text-xs text-muted-foreground'>{answer.question_name}</dt>
              <dd className='text-sm break-words'>
                {text || <span className='text-muted-foreground'>ไม่ได้กรอก</span>}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className='mt-2 text-xs text-muted-foreground'>
        ส่งเมื่อ <span className='tabular-nums'>{formatDateTime(survey.submitted_at)}</span> ·
        แบบสำรวจเวอร์ชัน {survey.version}
        {survey.line_sub_id && (
          <>
            {' '}
            · LINE <code className='font-mono'>{survey.line_sub_id}</code>
          </>
        )}
      </p>
    </section>
  );
}
