export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response('Invalid upload', { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const target = formData.get('target');

    if (!file || !target) {
      return new Response('Missing data', { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return new Response('File too large (10MB max)', { status: 413 });
    }

    return new Response(file.stream(), {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="converted.${target}"`
      }
    });
  }
};
