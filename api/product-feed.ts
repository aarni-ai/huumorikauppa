import type { VcercelRequest, VcercelResponse } from '@vercel/node';

interface Product {
  id: string;
    title: string;
      description: string;
        price: number;
          link: string;
            imageUrl: string;
              availability: 'in stock' | 'out of stock';
                category: string;
                }

                export default async function handler(
                  req: VcercelRequest,
                    res: VcercelResponse
                    ) {
                      if (req.method !== 'GET') {
                          return res.status(405).json({ error: 'Method not allowed' });
                            }

                              // Mock product data - replace with DB query
                                const products: Product[] = [
                                    {
                                          id: 'kalamies-t-paita',
                                                title: 'KALAMIES | T-Paita',
                                                      description: 'Klassinen puuvillapaita hauskal tekstillä',
                                                            price: 24.90,
                                                                  link: 'https://huumorikauppa.fi/tuote/kalamies-t-paita',
                                                                        imageUrl: 'https://huumorikauppa.fi/images/kalamies-t-paita.jpg',
                                                                              availability: 'in stock',
                                                                                    category: 'T-Paidat'
                                                                                        }
                                                                                          ];

                                                                                            const format = req.query.format as string || 'xml';

                                                                                              if (format === 'xml') {
                                                                                                  const xml = generateXmlFeed(products);
                                                                                                      res.setHeader('Content-Type', 'application/xml');
                                                                                                          return res.status(200).send(xml);
                                                                                                            } else if (format === 'csv') {
                                                                                                                const csv = generateCsvFeed(products);
                                                                                                                    res.setHeader('Content-Type', 'text/csv');
                                                                                                                        return res.status(200).send(csv);
                                                                                                                          }
                                                                                                                          
                                                                                                                            return res.status(400).json({ error: 'Invalid format' });
                                                                                                                            }
                                                                                                                            
                                                                                                                            function generateXmlFeed(products: Product[]): string {
                                                                                                                              let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
                                                                                                                                xml += '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n';
                                                                                                                                  xml += '<channel>\n';
                                                                                                                                    xml += '<title>Huumorikauppa Product Feed</title>\n';
                                                                                                                                      xml += '<link>https://huumorikauppa.fi</link>\n';
                                                                                                                                        xml += '<description>Finnish humor products</description>\n';
                                                                                                                                        
                                                                                                                                          products.forEach(product => {
                                                                                                                                              xml += '<item>\n';
                                                                                                                                                  xml += `<g:id>${escapeXml(product.id)}</g:id>\n`;
                                                                                                                                                      xml += `<title>${escapeXml(product.title)}</title>\n`;
                                                                                                                                                          xml += `<description>${escapeXml(product.description)}</description>\n`;
                                                                                                                                                              xml += `<g:price>${product.price} EUR</g:price>\n`;
                                                                                                                                                                  xml += `<link>${escapeXml(product.link)}</link>\n`;
                                                                                                                                                                      xml += `<g:image_link>${escapeXml(product.imageUrl)}</g:image_link>\n`;
                                                                                                                                                                          xml += `<g:availability>${product.availability}</g:availability>\n`;
                                                                                                                                                                              xml += `<g:product_type>${escapeXml(product.category)}</g:product_type>\n`;
                                                                                                                                                                                  xml += '</item>\n';
                                                                                                                                                                                    });
                                                                                                                                                                                    
                                                                                                                                                                                      xml += '</channel>\n</rss>';
                                                                                                                                                                                        return xml;
                                                                                                                                                                                        }
                                                                                                                                                                                        
                                                                                                                                                                                        function generateCsvFeed(products: Product[]): string {
                                                                                                                                                                                          const headers = ['id', 'title', 'description', 'price', 'link', 'image_link', 'availability', 'category'];
                                                                                                                                                                                            const rows = [headers.join(',')];
                                                                                                                                                                                            
                                                                                                                                                                                              products.forEach(product => {
                                                                                                                                                                                                  rows.push([
                                                                                                                                                                                                        product.id,
                                                                                                                                                                                                              `"${product.title}"`,
                                                                                                                                                                                                                    `"${product.description}"`,
                                                                                                                                                                                                                          product.price,
                                                                                                                                                                                                                                `"${product.link}"`,
                                                                                                                                                                                                                                      `"${product.imageUrl}"`,
                                                                                                                                                                                                                                            product.availability,
                                                                                                                                                                                                                                                  product.category
                                                                                                                                                                                                                                                      ].join(','));
                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                          return rows.join('\n');
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                          function escapeXml(str: string): string {
                                                                                                                                                                                                                                                            return str.replace(/[<>&'"]/g, char => {
                                                                                                                                                                                                                                                                const chars: Record<string, string> = {
                                                                                                                                                                                                                                                                      '<': '&lt;',
                                                                                                                                                                                                                                                                            '>': '&gt;',
                                                                                                                                                                                                                                                                                  '&': '&amp;',
                                                                                                                                                                                                                                                                                        "'": '&apos;',
                                                                                                                                                                                                                                                                                              '"': '&quot;'
                                                                                                                                                                                                                                                                                                  };
                                                                                                                                                                                                                                                                                                      return chars[char] || char;
                                                                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                                                                        }
