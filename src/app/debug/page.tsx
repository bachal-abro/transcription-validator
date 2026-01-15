import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  const supabase = createServerClient();
  
  // Fetch all data
  const { data: audios, error: audiosError } = await supabase
    .from('audios')
    .select('*');
  
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('*');
  
  const { data: transcriptions, error: transcriptionsError } = await supabase
    .from('transcriptions')
    .select('*');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Database Debug Information</h1>
        
        {/* Audios */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Audios Table</h2>
          {audiosError ? (
            <div className="text-red-600">
              <p className="font-medium">Error:</p>
              <pre className="text-xs mt-2 bg-red-50 p-3 rounded overflow-auto">
                {JSON.stringify(audiosError, null, 2)}
              </pre>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">Count: {audios?.length || 0}</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
                {JSON.stringify(audios, null, 2)}
              </pre>
            </>
          )}
        </div>

        {/* Models */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Models Table</h2>
          {modelsError ? (
            <div className="text-red-600">
              <p className="font-medium">Error:</p>
              <pre className="text-xs mt-2 bg-red-50 p-3 rounded overflow-auto">
                {JSON.stringify(modelsError, null, 2)}
              </pre>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">Count: {models?.length || 0}</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
                {JSON.stringify(models, null, 2)}
              </pre>
            </>
          )}
        </div>

        {/* Transcriptions */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Transcriptions Table</h2>
          {transcriptionsError ? (
            <div className="text-red-600">
              <p className="font-medium">Error:</p>
              <pre className="text-xs mt-2 bg-red-50 p-3 rounded overflow-auto">
                {JSON.stringify(transcriptionsError, null, 2)}
              </pre>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">Count: {transcriptions?.length || 0}</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
                {JSON.stringify(transcriptions, null, 2)}
              </pre>
            </>
          )}
        </div>

        {/* Environment Check */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
            </p>
            <p>
              <span className="font-medium">SUPABASE_SERVICE_ROLE_KEY:</span>{' '}
              {process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}
            </p>
            <p>
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
