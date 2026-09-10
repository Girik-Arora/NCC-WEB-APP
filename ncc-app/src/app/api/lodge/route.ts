import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('drive.google.com')) {
      return NextResponse.json({ error: 'Invalid Google Drive URL' }, { status: 400 });
    }

    // Call the Python script
    const scriptPath = path.join(process.cwd(), 'python_scanner.py');
    const command = `python "${scriptPath}" "${url}"`;
    
    console.log("Running python script:", command);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr && !stderr.includes('Created At') && !stderr.includes('tesseract')) {
      console.warn("Python stderr:", stderr);
    }
    
    // Parse the JSON output from the python script
    let resultData;
    try {
      resultData = JSON.parse(stdout.trim());
    } catch (parseErr) {
      console.error("Failed to parse Python output:", stdout);
      return NextResponse.json({ error: 'Failed to parse AI scanner output.' }, { status: 500 });
    }
    
    if (resultData.error) {
      return NextResponse.json({ error: resultData.error }, { status: 400 });
    }
    
    if (!resultData.findings || resultData.findings.length === 0) {
      return NextResponse.json({ error: 'No certificates found or readable in this folder.' }, { status: 400 });
    }

    return NextResponse.json({ findings: resultData.findings });
    
  } catch (error) {
    console.error('Auto-Lodge Error:', error);
    return NextResponse.json({ error: 'Failed to process Drive link' }, { status: 500 });
  }
}
