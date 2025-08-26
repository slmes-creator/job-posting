import { Metadata } from "next"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job } from "@/lib/types"

type Props = {
  params: { id: string }
  children: React.ReactNode
}

// This function generates dynamic metadata for each job page
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const jobId = params.id
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://volunteer-jobs.com"
  
  try {
    // Fetch job data from Firebase
    const jobDoc = await getDoc(doc(db, "jobs", jobId))
    
    if (jobDoc.exists()) {
      const job = jobDoc.data() as Job
      const jobUrl = `${baseUrl}/volunteer/jobs/${jobId}`
      const imageUrl = `${baseUrl}/placeholder.jpg` // Use job-specific image if available
      
      // Format date for better display
      const jobDate = job.date && typeof (job.date as any).toDate === 'function' 
        ? (job.date as any).toDate().toLocaleDateString()
        : new Date(job.date as any).toLocaleDateString()

      return {
        title: `${job.title} - ${job.organizationName} | Volunteer Opportunity`,
        description: `${job.description?.slice(0, 150)}... Join ${job.organizationName} on ${jobDate} for ${job.hoursOffered} hours of volunteering in ${job.location}.`,
        keywords: [
          "volunteer",
          "community service", 
          job.organizationName,
          job.location,
          "student volunteers",
          "volunteer hours"
        ],
        authors: [{ name: job.organizationName }],
        
        // Open Graph
        openGraph: {
          type: "website",
          url: jobUrl,
          title: `${job.title} - Volunteer with ${job.organizationName}`,
          description: `${job.description?.slice(0, 150)}... ${job.hoursOffered} hours • ${job.location} • ${jobDate}`,
          siteName: "Volunteer Jobs Platform",
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `${job.title} volunteer opportunity with ${job.organizationName}`,
            },
          ],
          locale: "en_US",
        },
        
        // Twitter
        twitter: {
          card: "summary_large_image",
          title: `${job.title} - ${job.organizationName}`,
          description: `${job.description?.slice(0, 150)}... ${job.hoursOffered} hours in ${job.location}`,
          images: [imageUrl],
          creator: "@yourplatform", // Replace with your Twitter handle
        },
        
        // Additional SEO
        robots: {
          index: job.status === "open", // Only index open jobs
          follow: true,
          googleBot: {
            index: job.status === "open",
            follow: true,
          },
        },
        
        // Canonical URL
        alternates: {
          canonical: jobUrl,
        },
        
        // Additional meta tags
        other: {
          "application-name": "Volunteer Jobs Platform",
          "apple-mobile-web-app-title": "Volunteer Jobs",
          "format-detection": "telephone=no",
        },
      }
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
  }

  // Fallback metadata if job not found or error
  return {
    title: "Volunteer Opportunity | Job Details",
    description: "Explore volunteer opportunities and make a difference in your community.",
    openGraph: {
      title: "Volunteer Opportunity",
      description: "Explore volunteer opportunities and make a difference in your community.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Volunteer Opportunity",
      description: "Explore volunteer opportunities and make a difference in your community.",
    },
  }
}

export default function JobLayout({ children }: Props) {
  return children
}
